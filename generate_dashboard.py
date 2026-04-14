#!/usr/bin/env python3
"""
Holded Performance Ads Dashboard Generator
Pulls data from Windsor.ai Google Ads connector and generates a self-contained
React HTML dashboard. Designed to run locally or via GitHub Actions.

Usage:
  WINDSOR_API_KEY=your_key python3 generate_dashboard.py

Environment variables:
  WINDSOR_API_KEY  - Your Windsor.ai API key (required)
  OUTPUT_PATH      - Output HTML path (default: ./index.html)
"""
import os
import sys
import json
import time
from datetime import datetime, timedelta
from collections import defaultdict
from urllib.request import urlopen, Request
from urllib.parse import urlencode, quote

# ============================================================
# CONFIG
# ============================================================
WINDSOR_API_KEY = os.environ.get('WINDSOR_API_KEY', '')
OUTPUT_PATH = os.environ.get('OUTPUT_PATH', './index.html')

# Google Ads accounts
ACCOUNTS = ['793-556-1699', '865-500-6023', '624-900-3211']

# Windsor API base
WINDSOR_BASE = 'https://connectors.windsor.ai/google_ads'

# ============================================================
# WINDSOR API HELPERS
# ============================================================
def windsor_get(fields, accounts=None, filters=None, date_from=None, date_to=None):
    """Query Windsor.ai REST API and return parsed JSON rows."""
    params = {
        'api_key': WINDSOR_API_KEY,
        'fields': ','.join(fields),
        '_renderer': 'json',
    }
    if accounts:
        params['accounts'] = ','.join(accounts)
    if filters:
        params['filter'] = filters
    if date_from:
        params['date_from'] = date_from
    if date_to:
        params['date_to'] = date_to

    url = WINDSOR_BASE + '?' + urlencode(params, quote_via=quote)
    print(f"  GET {url[:120]}...")

    for attempt in range(3):
        try:
            req = Request(url, headers={'User-Agent': 'HoldedDashboard/1.0'})
            with urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, dict) and 'data' in data:
                return data['data']
            if isinstance(data, list):
                return data
            return data
        except Exception as e:
            print(f"    Attempt {attempt+1} failed: {e}")
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                raise

def get_main_metrics():
    """Get base metrics per ad/campaign/month."""
    return windsor_get(
        fields=['ad_name', 'campaign_name', 'year_month', 'ad_group_ad_status',
                'ad_type', 'cost', 'impressions', 'clicks', 'engagements',
                'video_trueview_views'],
        accounts=ACCOUNTS
    )

def get_conversions(conv_name, value_field='all_conversions', extra_fields=None):
    """Get conversion data filtered by conversion_action_name."""
    fields = ['ad_name', 'campaign_name', 'year_month', 'conversion_action_name', value_field]
    if extra_fields:
        fields.extend(extra_fields)
    return windsor_get(
        fields=fields,
        accounts=ACCOUNTS,
        filters=f'conversion_action_name={conv_name}'
    )

def get_conversions_contains(conv_name_part, value_field='all_conversions', extra_fields=None):
    """Get conversion data where conversion_action_name contains the given string.
    Falls back to fetching ALL conversions and filtering in Python if API rejects contains syntax."""
    fields = ['ad_name', 'campaign_name', 'year_month', 'conversion_action_name', value_field]
    if extra_fields:
        fields.extend(extra_fields)
    # Try different contains syntaxes, fallback to fetch-all + filter in Python
    for syntax in [f'conversion_action_name~{conv_name_part}',
                   f'conversion_action_name=~{conv_name_part}']:
        try:
            return windsor_get(fields=fields, accounts=ACCOUNTS, filters=syntax)
        except Exception:
            pass
    # Fallback: fetch all conversions, filter in Python
    print(f"    Contains filter not supported, fetching all and filtering for '{conv_name_part}'...")
    try:
        all_rows = windsor_get(fields=fields, accounts=ACCOUNTS)
        return [r for r in all_rows if conv_name_part.lower() in r.get('conversion_action_name', '').lower()]
    except Exception as e:
        print(f"    Fallback also failed: {e}")
        return []

# ============================================================
# DATA PROCESSING
# ============================================================
def get_funnel(cam):
    cam_up = cam.upper()
    if '| ACQ' in cam_up or '- ACQ' in cam_up:
        return 'ACQ'
    if '| AWA' in cam_up or '- AWA' in cam_up:
        return 'AWA'
    if '| REM' in cam_up or '- REM' in cam_up or 'REMARKETING' in cam_up:
        return 'REM'
    if 'PARTNER' in cam_up:
        return 'PRO'
    return 'OTHER'

def is_relevant(cam, ad_type):
    skip_types = {'RESPONSIVE_SEARCH_AD', 'EXPANDED_TEXT_AD', 'CALL_AD', 'APP_AD'}
    if ad_type in skip_types:
        return 'PARTNER' in cam.upper()
    return True

def process_data(main_rows, conv_data):
    """Aggregate all data into monthly per-ad records."""
    ads = defaultdict(lambda: {
        'i': 0, 'c': 0, 'cl': 0, 'eg': 0, 'tv': 0,
        's': 'D', 't': '',
        'lp': 0, 'lp_gtm': 0, 'su': 0, 'sb': 0, 'sb_val': 0,
        'su_smb': 0, 'su_acc': 0, 'su_inv': 0,
        'web': 0, 'ebook': 0, 'guia': 0, 'inf_emp': 0,
        'acx': 0, 'hbs': 0, 'ptc': 0, 'c2c': 0,
        'qual': 0, 'ul7d': 0, 'vask': 0,
    })

    status_map = {'ENABLED': 'E', 'PAUSED': 'P'}

    # Main metrics
    for r in main_rows:
        cam = r.get('campaign_name', '')
        ad_type = r.get('ad_type', '')
        if not is_relevant(cam, ad_type):
            continue
        key = (r.get('ad_name', ''), cam, r.get('year_month', ''))
        d = ads[key]
        d['i'] += r.get('impressions', 0) or 0
        d['c'] += r.get('cost', 0) or 0
        d['cl'] += r.get('clicks', 0) or 0
        d['eg'] += r.get('engagements', 0) or 0
        d['tv'] += r.get('video_trueview_views', 0) or 0
        st = status_map.get(r.get('ad_group_ad_status', ''), 'D')
        if st == 'E':
            d['s'] = 'E'
        elif st == 'P' and d['s'] != 'E':
            d['s'] = 'P'
        d['t'] = ad_type

    # Process conversions
    for conv_type, rows in conv_data.items():
        for r in rows:
            key = (r.get('ad_name', ''), r.get('campaign_name', ''), r.get('year_month', ''))
            if key not in ads:
                continue
            can = r.get('conversion_action_name', '')
            d = ads[key]

            if conv_type == 'any_page_view':
                val = r.get('all_conversions', 0) or 0
                if 'GTM' in can:
                    d['lp_gtm'] += val
                else:
                    d['lp'] += val
            elif conv_type == 'first_account_created':
                d['su'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'first_account_sub_started':
                d['sb'] += r.get('all_conversions', 0) or 0
                d['sb_val'] += r.get('all_conversion_value', 0) or 0
            elif conv_type == 'webinar':
                d['web'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'qualification':
                d['qual'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'user_logged_in_7d':
                d['ul7d'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'submit_form':
                val = r.get('all_conversions', 0) or 0
                if 'ebook' in can.lower():
                    d['ebook'] += val
                elif 'guia' in can.lower():
                    d['guia'] += val
                else:
                    d['inf_emp'] += val
            elif conv_type == 'fac_variants':
                val = r.get('all_conversions', 0) or 0
                if 'smb' in can.lower():
                    d['su_smb'] += val
                elif 'accountant' in can.lower():
                    d['su_acc'] += val
                elif 'invoice' in can.lower():
                    d['su_inv'] += val
            elif conv_type == 'accountex':
                d['acx'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'hubspot':
                d['hbs'] += r.get('all_conversions', 0) or 0
            elif conv_type == 'partner_contacted':
                d['ptc'] += r.get('all_conversions', 0) or 0

    # Build output
    output = []
    for (ad_name, cam, ym), d in ads.items():
        if d['c'] < 1:
            continue
        rec = {
            'n': ad_name, 'cam': cam, 'ym': ym,
            's': d['s'], 't': d['t'], 'f': get_funnel(cam),
            'i': round(d['i']), 'c': round(d['c'], 2), 'cl': d['cl'],
            'eg': d['eg'], 'tv': d['tv'],
            'lp': round(d['lp']), 'lp_gtm': round(d['lp_gtm']),
            'su': round(d['su']), 'sb': round(d['sb']),
            'su_smb': round(d['su_smb']), 'su_acc': round(d['su_acc']),
            'web': round(d['web']), 'ebook': round(d['ebook']),
            'guia': round(d['guia']), 'inf_emp': round(d['inf_emp']),
            'acx': round(d['acx']), 'hbs': round(d['hbs']),
            'ptc': round(d['ptc']), 'c2c': round(d.get('c2c', 0)),
            'qual': round(d['qual']), 'ul7d': round(d['ul7d']),
            'vask': round(d.get('vask', 0)),
        }
        output.append(rec)

    return output

# ============================================================
# HTML GENERATION (uses the same React template as v3)
# ============================================================
def generate_html(monthly_data):
    """Generate the complete dashboard HTML with embedded data."""
    campaigns = sorted(set(r['cam'] for r in monthly_data))
    palette = [
        '#06b6d4','#6366f1','#818cf8','#f59e0b','#22d3ee','#fbbf24','#10b981',
        '#34d399','#a3e635','#94a3b8','#f472b6','#c084fc','#fb923c','#38bdf8',
        '#4ade80','#facc15','#f87171','#a78bfa','#2dd4bf','#e879f9',
        '#84cc16','#60a5fa','#fca5a1','#67e8f9','#d946ef','#fb7185',
        '#93c5fd','#86efac','#fde047','#c4b5fd','#a5f3fc','#bef264',
        '#fdba74','#d8b4fe','#5eead4','#fda4af','#7dd3fc','#a7f3d0',
        '#fef08a','#e9d5ff','#99f6e4','#fecdd3','#bae6fd','#bbf7d0',
        '#fef9c3','#f3e8ff','#ccfbf1','#ffe4e6','#e0f2fe','#dcfce7'
    ]
    cc_map = {cam: palette[i % len(palette)] for i, cam in enumerate(campaigns)}

    def ym_sort_key(ym):
        parts = ym.split('|')
        return int(parts[0]) * 100 + int(parts[1])
    all_months = sorted(set(r['ym'] for r in monthly_data), key=ym_sort_key)

    data_json = json.dumps(monthly_data, ensure_ascii=False, separators=(',', ':'))
    cc_json = json.dumps(cc_map, ensure_ascii=False)
    months_json = json.dumps(all_months)

    now = datetime.now().strftime('%d %b %Y %H:%M')

    # Read the React template
    template_path = os.path.join(os.path.dirname(__file__), 'template.jsx')
    with open(template_path, 'r', encoding='utf-8') as f:
        react_code = f.read()

    html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Holded Performance Ads Report</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#0a0f1a;font-family:'DM Sans',system-ui,sans-serif;color:#e2e8f0}}
button{{background:none;cursor:pointer;font-family:inherit;border:none}}
table{{border-spacing:0}}
::-webkit-scrollbar{{height:6px;width:6px}}
::-webkit-scrollbar-track{{background:rgba(255,255,255,0.03)}}
::-webkit-scrollbar-thumb{{background:rgba(255,255,255,0.1);border-radius:3px}}
select,input[type=number],input[type=text]{{background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px 8px;font-size:11px;font-family:inherit}}
input[type=text]::placeholder{{color:#475569}}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const {{useState,useMemo}} = React;
const RAW = {data_json};
const CC = {cc_json};
const ALL_MONTHS = {months_json};
const GENERATED_AT = "{now}";
{react_code}
</script>
</body>
</html>'''
    return html


# ============================================================
# MAIN
# ============================================================
def main():
    if not WINDSOR_API_KEY:
        print("ERROR: Set WINDSOR_API_KEY environment variable")
        sys.exit(1)

    print(f"=== Holded Performance Dashboard Generator ===")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Output: {OUTPUT_PATH}\n")

    # 1. Fetch main metrics
    print("[1/10] Fetching main metrics...")
    main_rows = get_main_metrics()
    print(f"  → {len(main_rows)} rows\n")

    # 2. Fetch conversions
    conv_data = {}

    print("[2/10] Fetching any_page_view...")
    try:
        conv_data['any_page_view'] = get_conversions_contains('any_page_view')
    except Exception as e:
        print(f"    WARNING: Failed to fetch any_page_view: {e}")
        conv_data['any_page_view'] = []
    print(f"  → {len(conv_data['any_page_view'])} rows\n")

    print("[3/10] Fetching first_account_created...")
    try:
        conv_data['first_account_created'] = get_conversions('first_account_created')
    except Exception as e:
        print(f"    WARNING: Failed to fetch first_account_created: {e}")
        conv_data['first_account_created'] = []
    print(f"  → {len(conv_data['first_account_created'])} rows\n")

    print("[4/10] Fetching first_account_sub_started...")
    try:
        conv_data['first_account_sub_started'] = windsor_get(
            fields=['ad_name','campaign_name','year_month','conversion_action_name',
                    'all_conversions','all_conversion_value'],
            accounts=ACCOUNTS,
            filters='conversion_action_name=first_account_sub_started'
        )
    except Exception as e:
        print(f"    WARNING: Failed to fetch first_account_sub_started: {e}")
        conv_data['first_account_sub_started'] = []
    print(f"  → {len(conv_data['first_account_sub_started'])} rows\n")

    print("[5/10] Fetching webinar_registered...")
    try:
        conv_data['webinar'] = get_conversions('webinar_registered')
    except Exception as e:
        print(f"    WARNING: Failed to fetch webinar: {e}")
        conv_data['webinar'] = []
    print(f"  → {len(conv_data['webinar'])} rows\n")

    print("[6/10] Fetching qualification_v2...")
    try:
        conv_data['qualification'] = get_conversions('qualification_v2')
    except Exception as e:
        print(f"    WARNING: Failed to fetch qualification: {e}")
        conv_data['qualification'] = []
    print(f"  → {len(conv_data['qualification'])} rows\n")

    print("[7/10] Fetching user_logged_in_7d...")
    try:
        conv_data['user_logged_in_7d'] = get_conversions('user_logged_in_7d')
    except Exception as e:
        print(f"    WARNING: Failed to fetch user_logged_in_7d: {e}")
        conv_data['user_logged_in_7d'] = []
    print(f"  → {len(conv_data['user_logged_in_7d'])} rows\n")

    print("[8/10] Fetching Submit_form variants...")
    try:
        conv_data['submit_form'] = get_conversions_contains('Submit_form')
    except Exception as e:
        print(f"    WARNING: Failed to fetch submit_form: {e}")
        conv_data['submit_form'] = []
    print(f"  → {len(conv_data['submit_form'])} rows\n")

    print("[9/10] Fetching first_account_created variants...")
    try:
        conv_data['fac_variants'] = get_conversions_contains('first_account_created')
    except Exception as e:
        print(f"    WARNING: Failed to fetch fac_variants: {e}")
        conv_data['fac_variants'] = []
    print(f"  → {len(conv_data['fac_variants'])} rows\n")

    print("[10/10] Fetching accountex, hubspot, partner_contacted...")
    try:
        conv_data['accountex'] = get_conversions('accountex-lead')
    except:
        conv_data['accountex'] = []
    try:
        conv_data['hubspot'] = get_conversions('hubspot_partners_form_submitted')
    except:
        conv_data['hubspot'] = []
    try:
        conv_data['partner_contacted'] = get_conversions('partner_contacted')
    except:
        conv_data['partner_contacted'] = []
    print(f"  → acx:{len(conv_data['accountex'])}, hbs:{len(conv_data['hubspot'])}, ptc:{len(conv_data['partner_contacted'])}\n")

    # 3. Process
    print("Processing data...")
    monthly_data = process_data(main_rows, conv_data)
    print(f"  → {len(monthly_data)} records, {len(set(r['n'] for r in monthly_data))} ads, "
          f"{len(set(r['cam'] for r in monthly_data))} campaigns\n")

    # 4. Generate HTML
    print("Generating dashboard HTML...")
    html = generate_html(monthly_data)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)

    size = os.path.getsize(OUTPUT_PATH)
    print(f"  → Written to {OUTPUT_PATH}: {size:,} bytes ({size/1024:.1f} KB)")
    print(f"\n✅ Dashboard generated successfully!")

if __name__ == '__main__':
    main()

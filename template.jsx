
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
const eur=n=>n===0?'—':'€'+Math.round(n).toLocaleString('es-ES');
const pct=n=>n===0?'—':n.toFixed(2)+'%';
const ymLabel=ym=>{const[y,m]=ym.split('|');const ml=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];return ml[parseInt(m)-1]+' '+y};
const ymSort=(a,b)=>{const[ay,am]=a.split('|').map(Number);const[by,bm]=b.split('|').map(Number);return(ay*100+am)-(by*100+bm)};

const FC={AWA:'#6366f1',ACQ:'#06b6d4',REM:'#f59e0b',PRO:'#10b981',OTHER:'#94a3b8'};
const FL={AWA:'Awareness',ACQ:'Acquisition',REM:'Remarketing',PRO:'Prospecting',OTHER:'Other'};
const SL={E:'Enabled',P:'Paused',D:'Disabled'};
const SC={E:'#22c55e',P:'#eab308',D:'#ef4444'};

const EXTRA_CONV = [
  {k:'su_smb',l:'SU SMB',desc:'Signups SMB'},
  {k:'su_acc',l:'SU ACC',desc:'Signups Accountant'},
  {k:'web',l:'WEB',desc:'Webinar Registered'},
  {k:'ebook',l:'EBOOK',desc:'Ebook Downloads'},
  {k:'guia',l:'GUÍA',desc:'Guía Contabilidad'},
  {k:'inf_emp',l:'INF.EMP',desc:'Informe Emprende'},
  {k:'acx',l:'ACX',desc:'Accountex Lead'},
  {k:'hbs',l:'HBS',desc:'HubSpot Partner Form'},
  {k:'ptc',l:'PTC',desc:'Partner Contacted'},
  {k:'c2c',l:'C2C',desc:'Click to Call'},
  {k:'qual',l:'QUAL',desc:'Qualification v2'},
  {k:'ul7d',l:'UL 7D',desc:'User Logged In 7D'},
  {k:'vask',l:'VASK',desc:'SMBs VideoAsk'}
];

// Sortable metric keys (for min filter dropdown)
const METRIC_KEYS = [
  {k:'c',l:'Cost (€)'},
  {k:'i',l:'Impressions'},
  {k:'cl',l:'Clicks'},
  {k:'su',l:'Signups'},
  {k:'sb',l:'Subs'},
  {k:'cpsu',l:'CPA Signup'},
  {k:'cpsb',l:'CPA Sub'},
  {k:'er',l:'Engagement %'},
  {k:'tvr',l:'TrueView %'},
  {k:'ctr',l:'CTR %'},
  {k:'lcr',l:'LPV CR %'},
  {k:'cls',l:'CR L→S %'},
  {k:'cap',l:'CAC PB (months)'},
  {k:'ar',l:'AR %'},
  {k:'lp',l:'LPV'},
  {k:'lp_gtm',l:'LPV GTM'},
  ...EXTRA_CONV.map(ec=>({k:ec.k,l:ec.l}))
];

function Bar({value,max,color='#06b6d4'}){const w=max>0?Math.min((value/max)*100,100):0;return<div style={{width:'100%',height:6,borderRadius:3,background:'rgba(255,255,255,0.06)'}}><div style={{width:w+'%',height:'100%',borderRadius:3,background:color,transition:'width 0.4s ease'}}/></div>}
function Badge({text,color,maxW}){return<span title={text} style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:.5,background:color+'22',color,border:'1px solid '+color+'44',whiteSpace:'nowrap',maxWidth:maxW||'none',overflow:'hidden',textOverflow:'ellipsis'}}>{text}</span>}
function ActionBadge({action}){const m={'SCALE':{c:'#22c55e',i:'▲',l:'ESCALAR'},'KEEP':{c:'#06b6d4',i:'►',l:'MANTENER'},'WATCH':{c:'#eab308',i:'◆',l:'VIGILAR'},'PAUSE':{c:'#ef4444',i:'■',l:'PAUSAR'},'REACTIVATE':{c:'#a855f7',i:'↻',l:'REACTIVAR'}}[action]||{c:'#eab308',i:'◆',l:'VIGILAR'};return<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:800,letterSpacing:.8,background:m.c+'22',color:m.c,border:'1px solid '+m.c+'44',whiteSpace:'nowrap'}}>{m.i} {m.l}</span>}

function getAction(a){
  if(a.f==='AWA'){if(a.er>=35&&a.tvr>=25)return'SCALE';if(a.er>=20&&a.tvr>=15)return'KEEP';if(a.er>=13)return'WATCH';return'PAUSE'}
  if(a.f==='ACQ'){if(a.su===0&&a.c>1000)return'PAUSE';if(a.su===0)return'WATCH';if(a.s==='P'&&a.cpsu<500&&a.sb>2)return'REACTIVATE';if(a.s==='P'&&a.cpsu<350)return'REACTIVATE';if(a.cpsu<500&&a.sb>0)return'SCALE';if(a.cpsu<800)return'KEEP';if(a.cpsu<1200)return'WATCH';return'PAUSE'}
  if(a.f==='REM'){if(a.cpsu>0&&a.cpsu<350&&a.sb>2)return'SCALE';if(a.cpsu>0&&a.cpsu<600)return'KEEP';if(a.cpsu>0&&a.cpsu<900)return'WATCH';if(a.su===0&&a.c>500)return'PAUSE';return'WATCH'}
  if(a.su>0&&a.cpsu<700)return'KEEP';if(a.su===0&&a.c>2000)return'WATCH';return'WATCH';
}

function shortCam(cam){
  const parts=cam.split('|');
  if(parts.length>=3){return parts[parts.length-2].trim()+' | '+parts[parts.length-1].trim()}
  if(parts.length>=2)return parts[parts.length-1].trim();
  return cam;
}

const card={background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:20};
const pill=a=>({padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid',transition:'all 0.2s',...(a?{background:'#06b6d4',color:'#0a0f1a',borderColor:'#06b6d4'}:{background:'transparent',color:'#94a3b8',borderColor:'rgba(255,255,255,0.1)'})});

function App(){
  const[tab,setTab]=useState('overview');
  const[funnelF,setFunnelF]=useState('ALL');
  const[stateF,setStateF]=useState('ALL');
  const[camF,setCamF]=useState('ALL');
  const[sortK,setSortK]=useState('c');
  const[sortD,setSortD]=useState('desc');
  const[showExtra,setShowExtra]=useState(false);

  // NEW: Time window state
  const[startMonth,setStartMonth]=useState(ALL_MONTHS[0]);
  const[endMonth,setEndMonth]=useState(ALL_MONTHS[ALL_MONTHS.length-1]);

  // NEW: Metric min filter state
  const[minMetric,setMinMetric]=useState('');
  const[minValue,setMinValue]=useState('');

  // NEW: Ad name text search
  const[adSearch,setAdSearch]=useState('');

  // Aggregate RAW by time window -> per-ad data (DATA)
  const DATA=useMemo(()=>{
    // Filter by month range
    const startIdx=ALL_MONTHS.indexOf(startMonth);
    const endIdx=ALL_MONTHS.indexOf(endMonth);
    const validMonths=new Set(ALL_MONTHS.slice(startIdx,endIdx+1));

    const filtered=RAW.filter(r=>validMonths.has(r.ym));

    // Aggregate by (ad_name, campaign)
    const map={};
    filtered.forEach(r=>{
      const key=r.n+'|||'+r.cam;
      if(!map[key]){
        map[key]={n:r.n,cam:r.cam,s:'D',t:r.t,f:r.f,
          i:0,c:0,cl:0,eg:0,tv:0,
          lp:0,lp_gtm:0,su:0,sb:0,sb_val:0,
          su_smb:0,su_acc:0,web:0,ebook:0,guia:0,inf_emp:0,
          acx:0,hbs:0,ptc:0,c2c:0,qual:0,ul7d:0,vask:0};
      }
      const d=map[key];
      d.i+=r.i||0; d.c+=r.c||0; d.cl+=r.cl||0; d.eg+=r.eg||0; d.tv+=r.tv||0;
      d.lp+=r.lp||0; d.lp_gtm+=r.lp_gtm||0;
      d.su+=r.su||0; d.sb+=r.sb||0;
      d.su_smb+=r.su_smb||0; d.su_acc+=r.su_acc||0;
      d.web+=r.web||0; d.ebook+=r.ebook||0; d.guia+=r.guia||0; d.inf_emp+=r.inf_emp||0;
      d.acx+=r.acx||0; d.hbs+=r.hbs||0; d.ptc+=r.ptc||0; d.c2c+=r.c2c||0;
      d.qual+=r.qual||0; d.ul7d+=r.ul7d||0; d.vask+=r.vask||0;
      // Status: E wins over P wins over D
      if(r.s==='E')d.s='E';
      else if(r.s==='P'&&d.s!=='E')d.s='P';
    });

    // Compute derived metrics
    return Object.values(map).map(d=>{
      const ctr=d.i>0?Math.round(d.cl/d.i*10000)/100:0;
      const er=d.i>0?Math.round(d.eg/d.i*10000)/100:0;
      const tvr=d.i>0?Math.round(d.tv/d.i*10000)/100:0;
      const lcr=d.cl>0?Math.round(d.lp/d.cl*10000)/100:0;
      const cls=d.lp_gtm>0?Math.round(d.su/d.lp_gtm*10000)/100:0;
      const cpsu=d.su>0?Math.round(d.c/d.su):0;
      const cpsb=d.sb>0?Math.round(d.c/d.sb):0;
      const cpm=d.i>0?Math.round(d.c/d.i*100000)/100:0;
      const cpv=d.tv>0?Math.round(d.c/d.tv*1000)/1000:0;
      const ar=d.su>0?Math.round(d.sb/d.su*1000)/10:0;
      // CAC PB: not available without sb_val per month; use 0 for now
      const cap=0;
      return{...d,ctr,er,tvr,lcr,cls,cpsu,cpsb,cpm,cpv,cap,ar};
    });
  },[startMonth,endMonth]);

  const campaigns=useMemo(()=>[...new Set(DATA.map(a=>a.cam))].sort(),[DATA]);

  const filtered=useMemo(()=>{
    let d=DATA.filter(a=>{
      if(funnelF!=='ALL'&&a.f!==funnelF)return false;
      if(stateF!=='ALL'&&a.s!==stateF)return false;
      if(camF!=='ALL'&&a.cam!==camF)return false;
      // NEW: Ad name text search
      if(adSearch){
        const terms=adSearch.toLowerCase().split(',').map(t=>t.trim()).filter(Boolean);
        const name=a.n.toLowerCase();
        if(!terms.some(t=>name.includes(t)))return false;
      }
      // NEW: Metric min filter
      if(minMetric&&minValue!==''){
        const val=parseFloat(minValue);
        if(!isNaN(val)&&(a[minMetric]||0)<val)return false;
      }
      return true;
    });
    d.sort((a,b)=>{const va=a[sortK]||0,vb=b[sortK]||0;return sortD==='desc'?vb-va:va-vb});
    return d;
  },[DATA,funnelF,stateF,camF,sortK,sortD,adSearch,minMetric,minValue]);

  const totals=useMemo(()=>{const r={cost:0,impr:0,clicks:0,signups:0,subs:0};filtered.forEach(a=>{r.cost+=a.c;r.impr+=a.i;r.clicks+=a.cl;r.signups+=a.su;r.subs+=a.sb});return r},[filtered]);

  const funnelSummary=useMemo(()=>{const m={};DATA.forEach(a=>{if(!m[a.f])m[a.f]={cost:0,impr:0,signups:0,subs:0,ads:0,en:0};m[a.f].cost+=a.c;m[a.f].impr+=a.i;m[a.f].signups+=a.su;m[a.f].subs+=a.sb;m[a.f].ads++;if(a.s==='E')m[a.f].en++});return m},[DATA]);

  const camSummary=useMemo(()=>{const m={};DATA.forEach(a=>{if(!m[a.cam])m[a.cam]={cost:0,impr:0,signups:0,subs:0,ads:0,en:0,f:a.f};m[a.cam].cost+=a.c;m[a.cam].impr+=a.i;m[a.cam].signups+=a.su;m[a.cam].subs+=a.sb;m[a.cam].ads++;if(a.s==='E')m[a.cam].en++});return m},[DATA]);

  const actionAds=useMemo(()=>{const s=[],p=[],r=[];DATA.forEach(a=>{const ac=getAction(a);if(ac==='SCALE')s.push(a);if(ac==='PAUSE')p.push(a);if(ac==='REACTIVATE')r.push(a)});s.sort((a,b)=>b.c-a.c);p.sort((a,b)=>b.c-a.c);r.sort((a,b)=>(a.cpsu||9999)-(b.cpsu||9999));return{scale:s,pause:p,reactivate:r}},[DATA]);

  const doSort=k=>{if(sortK===k)setSortD(d=>d==='desc'?'asc':'desc');else{setSortK(k);setSortD('desc')}};
  const SH=({k,children,w})=><th onClick={()=>doSort(k)} style={{padding:'10px 4px',textAlign:'right',cursor:'pointer',fontSize:9,fontWeight:600,color:sortK===k?'#06b6d4':'#94a3b8',letterSpacing:.3,width:w||'auto',whiteSpace:'nowrap',userSelect:'none',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{children}{sortK===k?(sortD==='desc'?' ↓':' ↑'):''}</th>;

  const td_s={padding:'6px 4px',textAlign:'right',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:10};

  // Date range label
  const rangeLabel=ymLabel(startMonth)+' — '+ymLabel(endMonth);

  return(
    <div style={{minHeight:'100vh',padding:'24px 20px',maxWidth:1800,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#06b6d4'}}/>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#06b6d4',textTransform:'uppercase'}}>Holded Performance Ads</span>
        </div>
        <h1 style={{fontSize:28,fontWeight:800,margin:'8px 0 4px',letterSpacing:'-.5px',color:'#f1f5f9'}}>Demand Gen & YouTube Report</h1>
        <p style={{fontSize:13,color:'#64748b',margin:0}}>{rangeLabel} · {DATA.length} ads · €{Math.round(DATA.reduce((s,a)=>s+a.c,0)).toLocaleString('es-ES')} invertidos · {campaigns.length} campañas</p>
      </div>

      {/* TIME WINDOW SELECTOR */}
      <div style={{...card,marginBottom:16,padding:'12px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',borderLeft:'3px solid #06b6d4'}}>
        <span style={{fontSize:12,fontWeight:700,color:'#06b6d4',letterSpacing:.5}}>⏱ Ventana de tiempo</span>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'#94a3b8'}}>Desde:</span>
          <select value={startMonth} onChange={e=>{setStartMonth(e.target.value);setCamF('ALL')}} style={{minWidth:100}}>
            {ALL_MONTHS.map(m=><option key={m} value={m}>{ymLabel(m)}</option>)}
          </select>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'#94a3b8'}}>Hasta:</span>
          <select value={endMonth} onChange={e=>{setEndMonth(e.target.value);setCamF('ALL')}} style={{minWidth:100}}>
            {ALL_MONTHS.map(m=><option key={m} value={m}>{ymLabel(m)}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[
            {l:'Último mes',fn:()=>{setStartMonth(ALL_MONTHS[ALL_MONTHS.length-1]);setEndMonth(ALL_MONTHS[ALL_MONTHS.length-1])}},
            {l:'Últimos 3m',fn:()=>{setStartMonth(ALL_MONTHS[Math.max(0,ALL_MONTHS.length-3)]);setEndMonth(ALL_MONTHS[ALL_MONTHS.length-1])}},
            {l:'Últimos 6m',fn:()=>{setStartMonth(ALL_MONTHS[Math.max(0,ALL_MONTHS.length-6)]);setEndMonth(ALL_MONTHS[ALL_MONTHS.length-1])}},
            {l:'YTD 2026',fn:()=>{const idx=ALL_MONTHS.findIndex(m=>m.startsWith('2026'));if(idx>=0){setStartMonth(ALL_MONTHS[idx]);setEndMonth(ALL_MONTHS[ALL_MONTHS.length-1])}}},
            {l:'Todo',fn:()=>{setStartMonth(ALL_MONTHS[0]);setEndMonth(ALL_MONTHS[ALL_MONTHS.length-1])}}
          ].map(({l,fn})=><button key={l} onClick={()=>{fn();setCamF('ALL')}} style={{padding:'3px 10px',borderRadius:6,fontSize:10,fontWeight:600,background:'rgba(6,182,212,0.1)',color:'#06b6d4',border:'1px solid rgba(6,182,212,0.2)',cursor:'pointer'}}>{l}</button>)}
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {[['overview','📊 Overview'],['campaigns','📁 Por Campaña'],['actions','🎯 Acciones'],['detail','📋 Detalle por Ad']].map(([k,l])=>
          <button key={k} onClick={()=>setTab(k)} style={pill(tab===k)}>{l}</button>
        )}
      </div>

      {/* OVERVIEW */}
      {tab==='overview'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:28}}>
          {['AWA','ACQ','REM','PRO','OTHER'].map(f=>{const s=funnelSummary[f];if(!s)return null;return(
            <div key={f} style={{...card,borderLeft:'3px solid '+FC[f]}}>
              <div style={{fontSize:11,fontWeight:700,color:FC[f],letterSpacing:1,marginBottom:12,textTransform:'uppercase'}}>{FL[f]}</div>
              <div style={{fontSize:22,fontWeight:800,color:'#f1f5f9'}}>{eur(s.cost)}</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{fmt(s.impr)} impr · {s.ads} ads ({s.en} activos)</div>
              <div style={{display:'flex',gap:16,marginTop:12}}>
                <div><div style={{fontSize:18,fontWeight:700,color:'#f1f5f9'}}>{s.signups}</div><div style={{fontSize:10,color:'#64748b'}}>Signups</div></div>
                <div><div style={{fontSize:18,fontWeight:700,color:'#f1f5f9'}}>{s.subs}</div><div style={{fontSize:10,color:'#64748b'}}>Subs</div></div>
                <div><div style={{fontSize:18,fontWeight:700,color:s.signups>0?(s.cost/s.signups<800?'#22c55e':'#ef4444'):'#64748b'}}>{s.signups>0?eur(Math.round(s.cost/s.signups)):'—'}</div><div style={{fontSize:10,color:'#64748b'}}>CPA Signup</div></div>
              </div>
            </div>
          )})}
        </div>

        <div style={{...card,marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'#22c55e',margin:'0 0 16px'}}>🏆 Top 10 ACQ — Mejor CPA Signup (Enabled, signups &gt; 0)</h3>
          {DATA.filter(a=>a.f==='ACQ'&&a.s==='E'&&a.su>0).sort((a,b)=>a.cpsu-b.cpsu).slice(0,10).map((a,i)=>
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<9?'1px solid rgba(255,255,255,0.04)':'none'}}>
              <span style={{fontSize:18,fontWeight:800,color:'#22c55e',width:24,textAlign:'center'}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{a.n}</div>
                <div style={{display:'flex',gap:10,marginTop:3,fontSize:11,color:'#94a3b8',flexWrap:'wrap'}}>
                  <span>CPA: <b style={{color:'#22c55e'}}>{eur(a.cpsu)}</b></span>
                  <span>SU: <b>{a.su}</b></span><span>SB: <b>{a.sb}</b></span>
                  <Badge text={shortCam(a.cam)} color={CC[a.cam]||'#94a3b8'} maxW="200px"/>
                </div>
                <div style={{marginTop:3}}><Bar value={1500-a.cpsu} max={1500} color="#22c55e"/></div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>{eur(a.c)}</div><div style={{fontSize:10,color:'#64748b'}}>invertido</div></div>
            </div>
          )}
        </div>

        <div style={{...card,marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'#6366f1',margin:'0 0 16px'}}>📢 Top 5 AWA — Mejor Engagement (Enabled)</h3>
          {DATA.filter(a=>a.f==='AWA'&&a.s==='E').sort((a,b)=>b.er-a.er).slice(0,5).map((a,i)=>
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none'}}>
              <span style={{fontSize:18,fontWeight:800,color:'#6366f1',width:24,textAlign:'center'}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{a.n}</div>
                <div style={{display:'flex',gap:10,marginTop:3,fontSize:11,color:'#94a3b8',flexWrap:'wrap'}}>
                  <span>Eng: <b style={{color:'#6366f1'}}>{a.er}%</b></span>
                  <span>TrueView: <b>{a.tvr}%</b></span><span>CPV: <b>€{a.cpv}</b></span>
                  <Badge text={shortCam(a.cam)} color={CC[a.cam]||'#94a3b8'} maxW="200px"/>
                </div>
                <div style={{marginTop:3}}><Bar value={a.er} max={75} color="#6366f1"/></div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>{fmt(a.i)}</div><div style={{fontSize:10,color:'#64748b'}}>impr</div></div>
            </div>
          )}
        </div>

        <div style={{...card}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'#f59e0b',margin:'0 0 16px'}}>🔄 Top 5 REM — Mejor CPA Sub</h3>
          {DATA.filter(a=>a.f==='REM'&&a.sb>0).sort((a,b)=>a.cpsb-b.cpsb).slice(0,5).map((a,i)=>
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none'}}>
              <span style={{fontSize:18,fontWeight:800,color:'#f59e0b',width:24,textAlign:'center'}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{a.n}</div>
                <div style={{display:'flex',gap:10,marginTop:3,fontSize:11,color:'#94a3b8',flexWrap:'wrap'}}>
                  <span>CPA Sub: <b style={{color:'#f59e0b'}}>{eur(a.cpsb)}</b></span>
                  <span>SB: <b>{a.sb}</b></span><span>CPA SU: <b>{eur(a.cpsu)}</b></span>
                  <Badge text={shortCam(a.cam)} color={CC[a.cam]||'#94a3b8'} maxW="200px"/>
                </div>
                <div style={{marginTop:3}}><Bar value={1500-(a.cpsb||0)} max={1500} color="#f59e0b"/></div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:14,fontWeight:700,color:'#f1f5f9'}}>{eur(a.c)}</div><div style={{fontSize:10,color:'#64748b'}}>invertido</div></div>
            </div>
          )}
        </div>
      </div>}

      {/* CAMPAIGNS */}
      {tab==='campaigns'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
          {Object.entries(camSummary).sort((a,b)=>b[1].cost-a[1].cost).map(([cam,s])=>{
            const color=CC[cam]||'#94a3b8';
            const cpaSu=s.signups>0?Math.round(s.cost/s.signups):0;
            const cpaSb=s.subs>0?Math.round(s.cost/s.subs):0;
            const topAds=DATA.filter(a=>a.cam===cam&&a.su>0).sort((a,b)=>a.cpsu-b.cpsu).slice(0,3);
            const worstAds=DATA.filter(a=>a.cam===cam&&a.s==='E'&&(a.su===0&&a.c>500||a.cpsu>1500)).sort((a,b)=>b.c-a.c).slice(0,2);
            return(
              <div key={cam} style={{...card,borderLeft:'3px solid '+color}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,gap:8}}>
                  <span title={cam} style={{fontSize:12,fontWeight:800,color,lineHeight:1.3,flex:1,minWidth:0}}>{cam}</span>
                  <span style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap',flexShrink:0}}>{s.ads} ads ({s.en} on)</span>
                </div>
                <div style={{fontSize:24,fontWeight:800,color:'#f1f5f9'}}>{eur(s.cost)}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{fmt(s.impr)} impr · <Badge text={s.f||'—'} color={FC[s.f]||'#94a3b8'}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginTop:16,padding:'12px 0',borderTop:'1px solid rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <div><div style={{fontSize:16,fontWeight:700,color:'#f1f5f9'}}>{s.signups}</div><div style={{fontSize:9,color:'#64748b'}}>Signups</div></div>
                  <div><div style={{fontSize:16,fontWeight:700,color:'#f1f5f9'}}>{s.subs}</div><div style={{fontSize:9,color:'#64748b'}}>Subs</div></div>
                  <div><div style={{fontSize:16,fontWeight:700,color:cpaSu>0?(cpaSu<600?'#22c55e':cpaSu<1000?'#eab308':'#ef4444'):'#64748b'}}>{cpaSu>0?eur(cpaSu):'—'}</div><div style={{fontSize:9,color:'#64748b'}}>CPA SU</div></div>
                  <div><div style={{fontSize:16,fontWeight:700,color:cpaSb>0?(cpaSb<800?'#22c55e':cpaSb<1500?'#eab308':'#ef4444'):'#64748b'}}>{cpaSb>0?eur(cpaSb):'—'}</div><div style={{fontSize:9,color:'#64748b'}}>CPA SB</div></div>
                </div>
                {topAds.length>0&&<div style={{marginTop:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#22c55e',letterSpacing:1,marginBottom:6}}>TOP ADS</div>
                  {topAds.map((a,i)=><div key={i} style={{fontSize:11,color:'#e2e8f0',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{a.n}</span><span style={{color:'#22c55e',fontWeight:700,flexShrink:0}}>CPA {eur(a.cpsu)}</span></div>
                  </div>)}
                </div>}
                {worstAds.length>0&&<div style={{marginTop:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#ef4444',letterSpacing:1,marginBottom:6}}>CANDIDATOS A PAUSAR</div>
                  {worstAds.map((a,i)=><div key={i} style={{fontSize:11,color:'#e2e8f0',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{a.n}</span><span style={{color:'#ef4444',fontWeight:700,flexShrink:0}}>{a.su===0?'0 SU':('CPA '+eur(a.cpsu))} · {eur(a.c)}</span></div>
                  </div>)}
                </div>}
              </div>
            );
          })}
        </div>
      </div>}

      {/* ACTIONS */}
      {tab==='actions'&&<div>
        {[{list:actionAds.scale,title:'▲ ESCALAR — Aumentar presupuesto',desc:'Ads con buenos CPAs, engagement alto o buen ratio de conversión.',color:'#22c55e'},
          {list:actionAds.reactivate,title:'↻ REACTIVAR — Pausados con buen rendimiento',desc:'Ads pausados pero con CPAs interesantes. Considerar reactivarlos.',color:'#a855f7'},
          {list:actionAds.pause,title:'■ PAUSAR — Rendimiento bajo o sin conversiones',desc:'Ads con CPA muy alto, sin signups o engagement pobre.',color:'#ef4444'}
        ].map(({list,title,desc,color},si)=>
          <div key={si} style={{...card,marginBottom:16,borderLeft:'3px solid '+color}}>
            <h3 style={{fontSize:14,fontWeight:700,color,margin:'0 0 4px'}}>{title}</h3>
            <p style={{fontSize:11,color:'#64748b',margin:'0 0 16px'}}>{desc}</p>
            {list.length===0&&<p style={{color:'#64748b',fontSize:12}}>Ninguno</p>}
            {list.map((a,i)=>
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <Badge text={FL[a.f]} color={FC[a.f]}/><Badge text={shortCam(a.cam)} color={CC[a.cam]||'#94a3b8'} maxW="160px"/>
                <Badge text={SL[a.s]} color={SC[a.s]}/>
                <div style={{flex:1,minWidth:200}}><div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{a.n}</div></div>
                <div style={{display:'flex',gap:12,fontSize:11,color:'#94a3b8',flexShrink:0}}>
                  {a.f==='AWA'?<><span>Eng: <b style={{color}}>{a.er}%</b></span><span>TV: <b>{a.tvr}%</b></span></>:
                    <>{a.su>0?<span>CPA su: <b style={{color}}>{eur(a.cpsu)}</b></span>:<span style={{color:'#ef4444',fontWeight:700}}>0 SU</span>}<span>SB: <b>{a.sb}</b></span></>}
                  <span>Cost: <b>{eur(a.c)}</b></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>}

      {/* DETAIL */}
      {tab==='detail'&&<div>
        <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>Funnel:</span>
          {['ALL','AWA','ACQ','REM','PRO','OTHER'].map(f=>
            <button key={f} onClick={()=>setFunnelF(f)} style={{...pill(funnelF===f),padding:'4px 12px',fontSize:11}}>{f==='ALL'?'Todos':FL[f]}</button>
          )}
          <span style={{fontSize:11,color:'#64748b',fontWeight:600,marginLeft:8}}>Estado:</span>
          {['ALL','E','P','D'].map(s=>
            <button key={s} onClick={()=>setStateF(s)} style={{...pill(stateF===s),padding:'4px 12px',fontSize:11}}>{s==='ALL'?'Todos':SL[s]}</button>
          )}
          <span style={{fontSize:11,color:'#64748b',fontWeight:600,marginLeft:8}}>Campaña:</span>
          <select value={camF} onChange={e=>setCamF(e.target.value)} style={{maxWidth:300}}>
            <option value="ALL">Todas ({campaigns.length})</option>
            {campaigns.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={()=>setShowExtra(!showExtra)} style={{...pill(showExtra),padding:'4px 12px',fontSize:11,marginLeft:8}}>{showExtra?'🔽 Ocultar Conv.':'🔼 Conv. Extra'}</button>
        </div>

        {/* NEW: Ad name search + Metric min filter */}
        <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>🔍 Ad Name:</span>
            <input type="text" value={adSearch} onChange={e=>setAdSearch(e.target.value)} placeholder="Buscar por nombre (coma = OR)..." style={{width:260}}/>
            {adSearch&&<button onClick={()=>setAdSearch('')} style={{fontSize:10,color:'#ef4444',cursor:'pointer',padding:'2px 6px',borderRadius:4,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.1)'}}>✕</button>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>📊 Mín:</span>
            <select value={minMetric} onChange={e=>setMinMetric(e.target.value)} style={{minWidth:100}}>
              <option value="">— Métrica —</option>
              {METRIC_KEYS.map(mk=><option key={mk.k} value={mk.k}>{mk.l}</option>)}
            </select>
            {minMetric&&<>
              <span style={{fontSize:11,color:'#94a3b8'}}>≥</span>
              <input type="number" value={minValue} onChange={e=>setMinValue(e.target.value)} placeholder="Valor" style={{width:80}}/>
              <button onClick={()=>{setMinMetric('');setMinValue('')}} style={{fontSize:10,color:'#ef4444',cursor:'pointer',padding:'2px 6px',borderRadius:4,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.1)'}}>✕</button>
            </>}
          </div>
        </div>

        <div style={{display:'flex',gap:16,marginBottom:12,padding:'10px 16px',background:'rgba(6,182,212,0.05)',borderRadius:8,border:'1px solid rgba(6,182,212,0.1)',fontSize:12,flexWrap:'wrap'}}>
          <span style={{color:'#94a3b8'}}>{filtered.length} ads</span>
          <span>Inversión: <b style={{color:'#06b6d4'}}>{eur(totals.cost)}</b></span>
          <span>Impr: <b>{fmt(totals.impr)}</b></span>
          <span>SU: <b>{totals.signups}</b></span>
          <span>SB: <b>{totals.subs}</b></span>
          {totals.signups>0&&<span>CPA medio: <b>{eur(Math.round(totals.cost/totals.signups))}</b></span>}
        </div>

        <div style={{overflowX:'auto',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:'rgba(255,255,255,0.03)'}}>
              <th style={{padding:'10px 6px',textAlign:'left',fontSize:9,fontWeight:600,color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.06)',minWidth:220,position:'sticky',left:0,background:'#0a0f1a',zIndex:2}}>Ad Name</th>
              <th style={{padding:'10px 4px',textAlign:'center',fontSize:9,fontWeight:600,color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.06)',minWidth:120}}>Campaña</th>
              <th style={{padding:'10px 4px',textAlign:'center',fontSize:9,fontWeight:600,color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.06)',width:70}}>Acción</th>
              <SH k="c" w="70px">Cost</SH><SH k="i" w="55px">Impr</SH><SH k="er" w="42px">Eng%</SH><SH k="tvr" w="42px">TV%</SH><SH k="ctr" w="42px">CTR</SH><SH k="lp" w="40px">LPV</SH><SH k="lcr" w="45px">LPV CR</SH><SH k="su" w="30px">SU</SH><SH k="sb" w="30px">SB</SH><SH k="cpsu" w="60px">CPA SU</SH><SH k="cpsb" w="60px">CPA SB</SH><SH k="cls" w="45px">CR L→S</SH><SH k="ar" w="35px">AR%</SH>
              {showExtra&&EXTRA_CONV.map(ec=><SH key={ec.k} k={ec.k} w="42px">{ec.l}</SH>)}
            </tr></thead>
            <tbody>
              {filtered.map((a,i)=>{
                const action=getAction(a);
                return(
                  <tr key={i} style={{background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                    <td style={{padding:'6px 6px',borderBottom:'1px solid rgba(255,255,255,0.04)',position:'sticky',left:0,background:i%2===0?'#0a0f1a':'#0b1120',zIndex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{width:5,height:5,borderRadius:'50%',background:SC[a.s],flexShrink:0}}/>
                        <Badge text={a.f} color={FC[a.f]}/>
                        <span style={{fontWeight:500,color:'#e2e8f0',fontSize:10,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}title={a.n}>{a.n}</span>
                      </div>
                    </td>
                    <td style={{padding:'6px 4px',borderBottom:'1px solid rgba(255,255,255,0.04)',textAlign:'center'}}><Badge text={shortCam(a.cam)} color={CC[a.cam]||'#94a3b8'} maxW="120px"/></td>
                    <td style={{padding:'6px 4px',borderBottom:'1px solid rgba(255,255,255,0.04)',textAlign:'center'}}><ActionBadge action={action}/></td>
                    <td style={{...td_s,fontWeight:600,color:'#f1f5f9'}}>{eur(a.c)}</td>
                    <td style={{...td_s,color:'#94a3b8'}}>{fmt(a.i)}</td>
                    <td style={{...td_s,color:a.er>=35?'#22c55e':a.er>=20?'#eab308':'#94a3b8',fontWeight:a.er>=35?700:400}}>{a.er>0?a.er+'%':'—'}</td>
                    <td style={{...td_s,color:a.tvr>=25?'#22c55e':'#94a3b8'}}>{a.tvr>0?a.tvr+'%':'—'}</td>
                    <td style={{...td_s,color:'#94a3b8'}}>{pct(a.ctr)}</td>
                    <td style={{...td_s,color:'#94a3b8'}}>{fmt(a.lp)}</td>
                    <td style={{...td_s,color:a.lcr>=20?'#22c55e':'#94a3b8'}}>{a.lcr>0?a.lcr+'%':'—'}</td>
                    <td style={{...td_s,fontWeight:700,color:a.su>0?'#f1f5f9':'#ef4444'}}>{a.su}</td>
                    <td style={{...td_s,fontWeight:700,color:a.sb>0?'#f1f5f9':'#64748b'}}>{a.sb}</td>
                    <td style={{...td_s,color:a.cpsu>0?(a.cpsu<500?'#22c55e':a.cpsu<800?'#eab308':'#ef4444'):'#64748b',fontWeight:600}}>{a.cpsu>0?eur(a.cpsu):'—'}</td>
                    <td style={{...td_s,color:a.cpsb>0?(a.cpsb<700?'#22c55e':a.cpsb<1500?'#eab308':'#ef4444'):'#64748b',fontWeight:600}}>{a.cpsb>0?eur(a.cpsb):'—'}</td>
                    <td style={{...td_s,color:'#94a3b8'}}>{a.cls>0?a.cls+'%':'—'}</td>
                    <td style={{...td_s,color:a.ar>0?(a.ar>=40?'#22c55e':a.ar>=25?'#eab308':'#ef4444'):'#64748b'}}>{a.ar>0?a.ar+'%':'—'}</td>
                    {showExtra&&EXTRA_CONV.map(ec=><td key={ec.k} style={{...td_s,color:a[ec.k]>0?'#e2e8f0':'#334155'}}>{a[ec.k]||0}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}

      <div style={{marginTop:32,padding:'16px 0',borderTop:'1px solid rgba(255,255,255,0.06)',fontSize:10,color:'#475569',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <span>Data mensual por Ad Name + Campaña · {rangeLabel} · Métricas recalculadas al cambiar ventana</span>
        <span>{typeof GENERATED_AT!=='undefined'?'Actualizado: '+GENERATED_AT+' · ':''} Criterios: AWA → Engagement/TrueView | ACQ → CPA Signup/Sub | REM → CPA Sub</span>
      </div>
    </div>
  );
}

const root=ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
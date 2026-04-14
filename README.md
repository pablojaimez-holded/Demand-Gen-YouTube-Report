# Holded Performance Ads Dashboard

Dashboard interactivo de creatividades para campañas de Demand Gen, YouTube y Display en Google Ads. Se genera automáticamente cada lunes con datos de Windsor.ai y se publica en GitHub Pages.

## Estructura

```
├── generate_dashboard.py    # Script que tira de Windsor API y genera el HTML
├── template.jsx             # Componente React del dashboard
├── index.html               # Dashboard generado (auto-generado)
├── .github/workflows/
│   └── update-dashboard.yml # GitHub Action semanal
└── README.md
```

## Setup paso a paso

### 1. Crear el repositorio en GitHub

Ve a [github.com/new](https://github.com/new) y crea un repo nuevo:
- **Nombre:** `holded-perf-dashboard` (o el que prefieras)
- **Visibilidad:** Public (necesario para GitHub Pages gratuito) o Private (requiere GitHub Pro/Team)
- **NO** inicializar con README (ya lo tenemos)

### 2. Subir el código

Desde la terminal, en la carpeta del proyecto:

```bash
cd holded-perf-dashboard
git init
git add .
git commit -m "🚀 Initial dashboard setup"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/holded-perf-dashboard.git
git push -u origin main
```

### 3. Añadir la API Key de Windsor como secreto

1. Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Nombre: `WINDSOR_API_KEY`
4. Valor: tu API key de Windsor.ai
5. Click **Add secret**

### 4. Activar GitHub Pages

1. Ve a tu repo → **Settings** → **Pages**
2. En **Source**, selecciona **GitHub Actions**
3. Guarda

### 5. Ejecutar el primer build

1. Ve a tu repo → **Actions** → **Update Dashboard**
2. Click **Run workflow** → **Run workflow**
3. Espera ~2 minutos a que termine
4. Tu dashboard estará live en: `https://TU_USUARIO.github.io/holded-perf-dashboard/`

## Refresh automático

El dashboard se actualiza automáticamente **cada lunes a las 9:00 AM hora de Madrid** (7:00 AM UTC). También puedes lanzar un refresh manual desde Actions → Run workflow en cualquier momento.

## Datos incluidos

- **3 cuentas de Google Ads:** Display & YouTube, Partners, Remarketing
- **Métricas:** Cost, Impressions, Clicks, Engagements, TrueView Views, CTR, ER, TVR, CPM, CPV
- **Conversiones:** Signups, Subs, LPV, Webinar, Ebook, Guía, Qualification, Accountex, HubSpot, PTC, Click to Call, User Logged In 7d
- **Métricas derivadas:** LPV CR, CR L→S, CPA SU, CPA SB, CAC PB, AR
- **Ventana temporal:** Desde enero 2025 hasta el mes actual
- **Granularidad:** Mensual por ad × campaña

## Personalización

- Edita `template.jsx` para cambiar el diseño o añadir métricas
- Modifica `generate_dashboard.py` para ajustar las queries a Windsor
- Cambia el cron en `.github/workflows/update-dashboard.yml` para otro horario

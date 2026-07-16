# CHANGELOG.md — Dashboard IEIE FFIE 2026

Formato basado en Keep a Changelog. Versionado por loops hasta el release v3.

---

## [1.0.0] — v3 release

### LOOP 6 — Metodología, validación integral y paquete para GitHub
- **Added:** pestaña Metodología completa (22 puntos requeridos, incl. tabla de fuente por
  componente y política de anonimización).
- **Added:** `README.md` completo (propósito, estructura, fuentes, requisitos, preparación de
  datos, ejecución local, actualización, publicación en Pages, errores frecuentes, privacidad,
  limitaciones) y `scripts/preparar_datos.py`.
- **Added (cierre LOOP 5):** `docs/ARQUITECTURA_SIG_MAPAS.md` + esquema visual del flujo SIG.
- **Fixed:** desbordamiento horizontal en móvil (brand-meta, tabs, selects) — verificado 375/320 px.
- **Validated:** 30/30 pruebas cuantitativas (dif=0), suite funcional completa, privacidad.

### LOOP 5 — Mapas interactivos y análisis territorial
- **Added:** pestaña "Mapas interactivos" (toolbar, panel lateral, leyenda dinámica, inset de
  San Andrés) con 8 capas: IEIE, cobertura, perfil rural-urbano, dimensión crítica, suficiencia,
  variable temática, prioridad exploratoria; niveles departamental y municipal.
- **Added (datos):** `geo/municipios.geojson` (MGN 2018, 1.122 muni, 1,18 MB, simplificado;
  unión por código DANE, sin asignación por nombre), `data/config_mapas.json` (capas + regla de
  prioridad exploratoria con umbrales transparentes).
- **Added:** campo `prioridad_exploratoria` por departamento en `resumen_departamental.json`.
- **Added (doc):** `docs/ARQUITECTURA_SIG_MAPAS.md` + esquema visual del flujo para el ingeniero SIG.
- **Design:** insuficiente/sin dato en gris neutro (nunca igual que "IEIE bajo"); nivel municipal
  bajo demanda para no penalizar la carga.
- **Limitación documentada:** municipio 27493 sin geometría en el shapefile (no se simula).
- **Validated:** prueba en navegador; capas, nivel municipal, temática y búsqueda operativas.

### LOOP 4 — Ficha territorial y módulo temático
- **Added:** pestaña "Ficha territorial y temática" con selectores país/depto/municipio/zona/
  tipo de sede/dimensión/variable/categoría.
- **Added:** ficha con total de sedes, muestra, cobertura, IEIE, dimensión crítica, suficiencia,
  comparación nacional y rural-urbana, narrativa automática, alertas y potencialidades.
- **Added:** catálogo de 15 variables de la encuesta (barras horizontales) con n válidas,
  % faltantes, fuente, nivel geográfico y nota de precaución.
- **Added (datos):** `data/variables_detalle.json`.
- **Decision — "Descriptivo":** confirmada su eliminación del menú (ya no existía como pestaña
  desde el rediseño del LOOP 2). Sus componentes útiles quedaron integrados en Resumen y en la
  Ficha territorial, evitando redundancia.
- **Validated:** 6 territorios contrastantes (2 con muestra insuficiente); coherencia de
  válidas/faltantes/categorías por variable.

### LOOP 3 — Implementación de Resumen y Análisis del IEIE
- **Added (código):** `index.html`, `styles.css`, `app.js`, `.nojekyll`, `assets/logo.svg`.
- **Resumen:** mapa Leaflet con inset de San Andrés; KPIs (marco, muestra, cobertura, IEIE,
  dimensión crítica, suficiencia); ranking territorial; comparación rural-urbana; distribución
  por categoría en barras apiladas 100%.
- **Análisis del IEIE:** nota metodológica; dumbbell por dimensión (territorio vs nacional);
  brechas; radar secundario; glosario interactivo con definiciones oficiales.
- **Estado compartido** país/depto/municipio + zona; cross-filter mapa↔tablero.
- **Removed:** gráfico de anillo/dona y tarjeta de desviación estándar (según diseño LOOP 2).
- **Fixed (datos):** municipio 41791 (Huila) con cobertura 102% → acotada a 100% con nota de
  trazabilidad (diferencia en código municipal reportado).
- **Validated:** 9/9 verificaciones (ver VALIDATION_REPORT).

### LOOP 2 — Arquitectura funcional y diseño UX/UI (sin programación)
- **Added:** `docs/DASHBOARD_ARCHITECTURE.md` — wireframes de las 5 pestañas, catálogo de
  componentes, flujo de filtros (estado global ámbito/zona), especificación de gráficos
  (ECharts) y de mapas (Leaflet), y reglas de narrativa automática determinística.
- **Added:** `data/glosario_dimensiones.json` — definiciones oficiales D1–D9, escala,
  categorías y niveles de calidad (fuente: Informe Metodológico Ejecutivo IEIE).
- **Added:** wireframe visual de la portada (Resumen).
- **Design decisions:** "Descriptivo" eliminada como pestaña (integrada); anillo/dona
  reemplazado por barras apiladas 100%; tarjeta de desviación estándar eliminada; dumbbell
  como gráfico principal del análisis (radar secundario); recuadro de precaución condicional.
- **Note:** sin implementación de código; corresponde a loops siguientes.

### LOOP 1 — Auditoría y preparación de datos
- **Added:** capa de datos pública en `data/` (8 JSON) + `geo/departamentos.geojson`.
  - `resumen_nacional.json`, `resumen_departamental.json`, `resumen_municipal.json`,
    `perfil_dimensiones.json`, `resultados_rural_urbano.json`, `variables_tematicas.json`,
    `metadatos_variables.json`, `suficiencia_muestral.json`.
- **Added:** `docs/DATA_DICTIONARY.md`, `docs/VALIDATION_REPORT.md` (tabla de conciliación).
- **Validated:** cruce 100% base↔marco; muestra válida 18.897 (173 atípicos excluidos);
  cobertura 38,91 %; IEIE 69,86 (coincide con v2, dif 0).
- **Fixed (datos):** `enc_departamento` venía como código DANE numérico → mapeado a nombre
  oficial del marco; Bogotá D.C. etiquetada como Distrito Capital (cod 11).
- **Added:** suficiencia muestral (umbral 30); advertencia en San Andrés y Guainía.
- **Note:** no se reemplazan aún valores en el dashboard (corresponde a loops siguientes).

### LOOP 0 — Auditoría (sin cambios de código)
- **Added:** documentación de control del proyecto v3:
  - `docs/AUDIT_DASHBOARD.md` (auditoría completa de v2).
  - `docs/PROGRESS.md` (control de avance por loops).
  - `docs/CHANGELOG.md` (este archivo).
- **Audited:** proyecto `dashboard_ieie_v2_github` — estructura, librerías (Leaflet 1.9.4,
  ECharts 5.5.0), carga de datos (fetch de 5 JSON + 1 GeoJSON), gráficos, mapa, filtros,
  privacidad y compatibilidad con GitHub Pages.
- **Findings:**
  - Sin cifras escritas a mano en HTML/JS (cumple regla 7).
  - Sin dependencias incompatibles con GitHub Pages.
  - CSV público sin columnas personales.
  - Módulos temáticos nacionales incompletos (a corregir).
  - Pestaña "Descriptivo" redundante (a integrar/eliminar).
  - Algunos agregados se calculan en cliente y deberían pre-prepararse.
- **Decision:** evolución del proyecto, NO reconstrucción total.

---

## Referencia — versiones previas (contexto)
- **v2:** dashboard modular con pestañas, Leaflet + ECharts, datos de la base sin atípicos
  (~18.897 sedes). Publicado en GitHub Pages.
- **v1 / Loops 1–4.5:** iteraciones previas (base anonimizada, tablas, mapas PNG,
  estructura HTML/CSS/JS).

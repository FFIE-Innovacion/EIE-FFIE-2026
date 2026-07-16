# AUDIT_DASHBOARD.md — Auditoría del proyecto actual (v2)

**Proyecto auditado:** `dashboard_ieie_v2_github.zip`
**Fecha:** LOOP 0
**Alcance:** solo auditoría. No se modificó diseño ni datos.

---

## 1. Inventario técnico

### 1.1 Estructura de carpetas
```
/ (raíz)
├── index.html              (184 líneas)
├── styles.css              (132 líneas)
├── app.js                  (354 líneas)
├── .nojekyll               (correcto para GitHub Pages)
├── README.md
├── assets/  logo.svg
├── data/    nacional.json · departamentos.json · municipios.json ·
│            sedes.json (3,3 MB) · dimensiones.json · base_publica.csv (3,5 MB)
├── geo/     departamentos.geojson (308 KB)
└── maps/    4 PNG (IEIE, dim crítica, prioridad, San Andrés)
```

### 1.2 Librerías (todas por CDN)
- **Leaflet 1.9.4** (unpkg) — mapa.
- **Apache ECharts 5.5.0** (jsDelivr) — gráficos.
- Sin frameworks (JS vanilla). Sin dependencias de build.

### 1.3 Forma de cargar datos
- `fetch()` de 5 JSON + 1 GeoJSON, en paralelo al inicio. Correcto para estático.
- No usa localStorage/sessionStorage ni APIs externas de datos. **Compatible con GitHub Pages.**

### 1.4 Componentes (funciones app.js)
Render por módulo: `pintarKPIs`, `pintarResumenCharts`, `pintarIndice`, `pintarModulos`,
`pintarTabla`, `pintarDescriptivo`, `pintarMapa`/`initMapa`/`resaltarMapa`/`rampa`/`pintarLeyenda`.
Utilidades: `num`, `pct`, `f`, `norm`, `dimName`, `ctx`, `ech`, `activar`, `setDep`, `ordenar`.

### 1.5 Gráficos existentes (ECharts)
`chart-dist` (dona categorías), `chart-ranking` (barras depto), `chart-radar` (D1–D9),
`chart-dim-bars` (barras dimensión), `chart-desc-cat`, `chart-desc-ur`, `chart-desc-disp`.

### 1.6 Mapa
Leaflet con GeoJSON de departamentos (MGN 2018 simplificado), coropleta por métrica
seleccionable, popup, clic que filtra el tablero, leyenda. Base cartográfica: CARTO light.

### 1.7 Filtros
Selector de departamento + clic en mapa (cross-filter) + buscador de sedes + orden de tabla.
Funcionan y están sincronizados vía `state` global.

---

## 2. Hallazgos

### 2.1 Componentes que funcionan (verificados)
- Navegación por pestañas, carga de datos, KPIs, todos los gráficos ECharts, mapa Leaflet
  con cross-filter, buscador y tabla de sedes. Arquitectura estática sólida y sin dependencias
  incompatibles con GitHub Pages.

### 2.2 Componentes rotos / débiles
- **Módulos temáticos a nivel nacional:** solo muestran mensaje "selecciona un departamento";
  no hay agregado nacional real por módulo. **Corregir** (pre-agregar nacional).
- **Descriptivo:** ver sección 3.
- **Cálculos en JavaScript** que deberían pre-agregarse: promedio nacional de % rural
  (`reduce` en cliente, línea 229), derivación de dimensión crítica/fuerte nacional
  (líneas 167–168), conteos de categorías. Van contra el principio "evita repetir cálculos
  en JS si pueden prepararse previamente". **Reorganizar** hacia el script de datos.

### 2.3 Datos escritos manualmente
- **No se hallaron cifras fijas en HTML/JS** (18.897, 69,86, 33, etc.). Todo se lee de JSON.
  ✔ Cumple la regla 7. Se mantiene este principio en v3.

### 2.4 Duplicación de código
- Baja. La función `ech()` centraliza instancias ECharts. La lógica de categorías se repite
  levemente entre `pintarResumenCharts` y `pintarDescriptivo` (misma dona/orden de categorías).

### 2.5 Dependencias incompatibles con GitHub Pages
- **Ninguna.** Todo es estático + CDN. El `.nojekyll` está presente.

### 2.6 Riesgos de privacidad
- CSV público (`base_publica.csv`): 21 columnas, **sin** columnas personales (celular, correo,
  nombre del diligenciador, fecha de visita). ✔
- `sedes.json`: incluye **nombre de sede y de institución educativa**. No es dato personal de
  contacto, pero permite identificar la sede. Es información pública institucional (código DANE +
  nombre de sede son públicos), por lo que se considera **aceptable**, pero se revisará en v3 si
  conviene mantener el nombre o solo el código, según sensibilidad.
- **Riesgo mayor detectado en fuentes nuevas (no en v2):** `Poblacion_Total__13_.xlsx` contiene
  columnas **Correo, Celular, Contacto** → deben excluirse por completo del proyecto público v3
  (reglas 12–14). El XLSX original NO debe incluirse en la carpeta pública.

---

## 3. Clasificación de pestañas

| Pestaña | Estado | Decisión |
|---|---|---|
| Resumen | Funciona | **Conservar** (KPIs + dona + ranking). Añadir nota Bogotá D.C. |
| Análisis del índice | Funciona | **Conservar** (radar + barras D1–D9 + crítica/fuerte). |
| Módulos temáticos | Débil a nivel nacional | **Corregir** (pre-agregar nacional; hoy solo funciona por depto). |
| Mapa interactivo | Funciona | **Conservar** (mejorar: suficiencia muestral, capa municipal opcional). |
| Explorador de sedes | Funciona | **Conservar**. |
| Descriptivo | Redundante (ver abajo) | **Integrar / eliminar como pestaña** (ver decisión). |
| Metodología | Estático | **Conservar y ampliar** (marco poblacional, atípicos, cobertura, suficiencia). |

---

## 4. Decisión preliminar sobre la pestaña "Descriptivo"

**La pestaña Descriptivo NO aporta información exclusiva.** Sus tres gráficos son:
- "Sedes por categoría IEIE" → **duplica** la dona del Resumen.
- "Urbano vs. rural" → pertenece conceptualmente al **módulo temático de cobertura**.
- "Dispersión por departamento (promedio ± desv.)" → **complementa el ranking** del Resumen.
- Los mapas PNG → material cartográfico que encaja mejor junto al **Mapa interactivo** o en Metodología.

**Recomendación (conforme a la instrucción):** eliminar "Descriptivo" como pestaña independiente
e integrar sus componentes útiles donde aportan valor:
- gráfico de dispersión → dentro de **Resumen** (o ficha territorial) como complemento del ranking;
- urbano/rural → dentro de **Módulos temáticos** (cobertura);
- mapas PNG → junto al **Mapa interactivo** o en **Metodología** como cartografía técnica de referencia.

Esto reduce redundancia y refuerza el enfoque de "fichas territoriales" que pide el contexto maestro.

---

## 5. ¿Puede evolucionar sin reconstruirse por completo?

**Sí.** La arquitectura de v2 es sólida: estática, sin cifras a mano, sin dependencias
incompatibles, con separación HTML/CSS/JS y datos en JSON. **No se justifica reconstruir desde cero.**
El trabajo de v3 será **evolutivo**:
1. **Rehacer la capa de datos** desde las bases oficiales nuevas (`FFIE_2026_Base_Unida_IEIE.xlsx`
   + `Poblacion_Total__13_.xlsx`), recalculando agregados y **cobertura poblacional** (denominador),
   aplicando el tratamiento de atípicos definido, y diferenciando suficiencia muestral.
2. **Corregir** módulos temáticos nacionales y **pre-agregar** los cálculos que hoy se hacen en JS.
3. **Reorganizar** la pestaña Descriptivo (integrarla).
4. **Ampliar** metodología (Bogotá D.C. como Distrito Capital, atípicos, suficiencia).
5. Mantener Leaflet + ECharts (funcionan, sin licencia privada).

---

## 6. Nota sobre cifras (pendiente para LOOP 1)
Las cifras de v2 (18.897 sedes, IEIE 69,86, 33 territorios) provienen de la base anterior
(sin atípicos). La base oficial nueva trae **19.071 filas**; la diferencia son los registros
atípicos. En v3 **todas las cifras se recalcularán y validarán** desde las bases oficiales,
aplicando el tratamiento de atípicos indicado por el responsable del proyecto. Ninguna cifra
se fijará a mano.

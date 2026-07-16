# DASHBOARD_ARCHITECTURE.md — Dashboard IEIE FFIE 2026 (v3)

Diseño funcional y UX/UI **previo a la programación**. Define módulos, wireframes, componentes,
flujo de filtros, y especificación de gráficos y mapas. No incluye implementación.

Insumos leídos: `PROGRESS.md`, `AUDIT_DASHBOARD.md`, `DATA_DICTIONARY.md`, `VALIDATION_REPORT.md`
y el Informe Metodológico oficial (para el glosario de dimensiones).

---

## 0. Principios de diseño

- **Estático, sin backend.** Datos pre-agregados en `data/*.json` + `geo/*.geojson`. Sin cálculos
  pesados en cliente. Compatible con GitHub Pages.
- **Sin cifras a mano.** Todo valor proviene de los JSON validados en LOOP 1.
- **Estética institucional FFIE** inspirada en las imágenes de referencia (layout de tres
  columnas tipo "Mapa de proyectos": panel de control · mapa central · resumen lateral).
- **Accesible y responsivo** (escritorio, tableta, teléfono).
- **Narrativas determinísticas** por reglas; nunca un LLM en el dashboard; sin afirmaciones
  causales ni calificativos fuera de la regla metodológica.
- **Librerías:** Leaflet (mapas) + ECharts (gráficos). Se conservan por funcionar y no requerir
  licencia privada.

---

## 1. Arquitectura de módulos (pestañas)

Se reduce de 7 pestañas (v2) a **5**, eliminando "Descriptivo" e integrando su contenido:

| # | Pestaña | Propósito | Absorbe de "Descriptivo" |
|---|---|---|---|
| 1 | **Resumen** | Portada dinámica nacional/territorial con mapa, KPIs y comparativas. | Barras de distribución, comparación rural-urbana, dispersión (ranking). |
| 2 | **Análisis del IEIE** | Índice y sus 9 dimensiones; glosario interactivo. | — |
| 3 | **Ficha territorial y análisis temático** | Ficha técnica por territorio + variables de la encuesta. | Gráficos por variable, urbano/rural. |
| 4 | **Mapas interactivos** | Geovisor coroplético multi-métrica. | Mapas PNG técnicos como capa de referencia. |
| 5 | **Metodología y calidad** | Escala, categorías, calidad, atípicos, suficiencia, fuentes. | Nota metodológica y mapas técnicos. |

**Decisión "Descriptivo":** eliminada como pestaña independiente (confirmado desde el AUDIT).
Sus componentes útiles se integran donde aportan (Resumen y Ficha territorial).

---

## 2. Wireframes (esquemático)

### 2.1 Layout global
```
┌───────────────────────────────────────────────────────────────┐
│ TOPBAR  logo · "IEIE 2026 · FFIE" · corte de información        │
│ TABS    [Resumen][Análisis IEIE][Ficha territorial][Mapas][Met.]│
├───────────────────────────────────────────────────────────────┤
│ FILTER BAR  [País/Depto/Municipio ▾]  [Zona: Total/Rural/Urbana]│
│             (píldora de ámbito activo) [Volver a nacional]      │
├───────────────────────────────────────────────────────────────┤
│ PANEL ACTIVO (una pestaña visible)                              │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Pestaña 1 — Resumen (portada, 3 columnas tipo referencia FFIE)
```
┌──────────────┬───────────────────────────┬───────────────────────┐
│ PANEL IZQ    │  MAPA PRINCIPAL Colombia   │ RESUMEN LATERAL       │
│ (control)    │  (coropleta IEIE por depto)│ (ficha del ámbito)    │
│ • ámbito     │  clic → filtra todo        │ ┌───────────────────┐ │
│ • zona       │                            │ │ Nombre territorio │ │
│ • botones    │                            │ │ (o "Colombia")    │ │
│   Ver mapa / │                            │ └───────────────────┘ │
│   Ver nac.   │                            │ KPI Marco sedes       │
│ • nota corte │                            │ KPI Muestra válida    │
│              │                            │ KPI Cobertura %       │
│              │                            │ KPI IEIE              │
│              │                            │ KPI Dim. más crítica  │
│              │                            │ chip Suficiencia      │
└──────────────┴───────────────────────────┴───────────────────────┘
┌───────────────────────────────┬───────────────────────────────────┐
│ Ranking territorial (barras H) │ Comparación rural-urbana (barras) │
├───────────────────────────────┴───────────────────────────────────┤
│ Distribución del IEIE por categoría (barras apiladas 100% o H)      │
├─────────────────────────────────────────────────────────────────── ┤
│ ⚠ Recuadro de precaución (SOLO si el ámbito tiene muestra insufic.) │
│ Notas metodológicas contextuales                                    │
└─────────────────────────────────────────────────────────────────────┘
```
**Eliminado:** tarjeta de desviación estándar, gráfico de anillo/dona, cifras a mano.
**Reemplazo del anillo:** barras horizontales ordenadas + barras apiladas al 100% para
la distribución por categoría.

### 2.3 Pestaña 2 — Análisis del IEIE
```
[ Nota metodológica fija: escala 0–100, mayor = mejor, leer con cobertura/suficiencia ]
┌───────────────────────────────────────────────────────────────┐
│ GRÁFICO PRINCIPAL: DUMBBELL horizontal por dimensión D1..D9     │
│  cada fila: ● territorio  ● nacional  ● rural  ● urbano         │
│  (puntos conectados; permite leer brechas con precisión)        │
├──────────────────────────────┬────────────────────────────────┤
│ KPIs: IEIE, dim. crítica,    │ RADAR (secundario, opcional)   │
│ dim. más fuerte, brecha nac. │ perfil D1..D9                  │
├──────────────────────────────┴────────────────────────────────┤
│ GLOSARIO INTERACTIVO (acordeón) D1..D9                          │
│  ▸ D1 · Servicios públicos básicos   (clic despliega)           │
│     definición · variables · orientación · lenguaje sencillo    │
└───────────────────────────────────────────────────────────────┘
```

### 2.4 Pestaña 3 — Ficha territorial y análisis temático
```
FILTROS FICHA: [Territorio][Zona][Tipo sede][Dimensión][Variable][Categoría]
┌───────────────────────────┬───────────────────────────────────┐
│ IDENTIFICACIÓN + KPIs      │ MAPA del territorio (mini geovisor)│
│ sedes · muestra · cobertura│                                   │
│ IEIE · suficiencia         │                                   │
├───────────────────────────┴───────────────────────────────────┤
│ Perfil de dimensiones vs nacional (dumbbell/barras)             │
│ Comparación rural-urbana                                        │
├───────────────────────────────────────────────────────────────┤
│ NARRATIVA AUTOMÁTICA (texto determinístico verificable)         │
├───────────────────────────────────────────────────────────────┤
│ PANEL DE VARIABLE seleccionada:                                 │
│  nombre · definición · n válidas · faltantes · unidad           │
│  distribución (barras) · rural-urbana · territorial vs nacional │
│  mapa (si aplica) · texto descriptivo                           │
├───────────────────────────────────────────────────────────────┤
│ Condiciones principales · Variables críticas · Potencialidades  │
│ · Alertas (chips)                                               │
└───────────────────────────────────────────────────────────────┘
```

### 2.5 Pestaña 4 — Mapas interactivos
```
TOOLBAR: [Métrica ▾ IEIE/%rural/%sin agua/…]  [Zona ▾]  leyenda
┌───────────────────────────────────────────────────────────────┐
│ GEOVISOR Leaflet (departamental; municipal futuro)              │
│  hover → tooltip · clic → filtra tablero · popup con ficha      │
├───────────────────────────────────────────────────────────────┤
│ Cartografía técnica de referencia (PNG ArcGIS/ESRI): 4 mapas    │
└───────────────────────────────────────────────────────────────┘
```

### 2.6 Pestaña 5 — Metodología y calidad
Escala 0–100 y categorías (tabla), niveles de calidad, tratamiento del 999, atípicos,
suficiencia muestral, cobertura y denominador, fuentes oficiales, y limitaciones.

---

## 3. Catálogo de componentes

| ID componente | Tipo | Datos (fuente JSON) | Reutilizable en |
|---|---|---|---|
| `TopBar` | layout | `resumen_nacional` (corte) | global |
| `TabNav` | navegación | — | global |
| `FilterBar` | control | `resumen_departamental`, `resumen_municipal` | global (estado compartido) |
| `ScopePill` | indicador | estado | global |
| `KpiCard` | tarjeta | según ámbito | Resumen, Ficha |
| `SuffChip` | chip estado | `suficiencia_muestral` | Resumen, Análisis, Ficha |
| `CautionBox` | recuadro condicional | `suficiencia_muestral` | Resumen, Ficha |
| `MainMap` | mapa Leaflet | `geo/departamentos.geojson` + `resumen_departamental` | Resumen, Mapas |
| `RankingBars` | ECharts barras H | `resumen_departamental` | Resumen |
| `RuralUrbanBars` | ECharts barras | `resultados_rural_urbano` | Resumen, Análisis, Ficha |
| `CategoryStacked` | ECharts barras apiladas 100% | `resumen_nacional`/`_departamental` | Resumen |
| `DumbbellDims` | ECharts (custom/scatter+line) | `resumen_departamental` + `perfil_dimensiones` + `resultados_rural_urbano` | Análisis, Ficha |
| `RadarDims` | ECharts radar (secundario) | idem | Análisis |
| `DimGlossary` | acordeón | `glosario_dimensiones.json` | Análisis |
| `TerritoryCard` | ficha | `resumen_departamental` | Ficha |
| `VariablePanel` | panel variable | `variables_tematicas` + `resumen_departamental.modulos` | Ficha |
| `AutoNarrative` | texto por reglas | agregados del ámbito | Ficha |
| `MethodologyTables` | tablas | `glosario_dimensiones.json` | Metodología |

---

## 4. Flujo de filtros (estado global)

```
estado = { ambito: "nacional" | cod_depto | mpio_cod,
           nivel:  "pais" | "departamento" | "municipio",
           zona:   "total" | "rural" | "urbano" }
```

- **Fuentes de cambio de ámbito:** selector jerárquico (país→depto→municipio) y clic en el mapa.
  Ambos escriben el mismo `estado.ambito` (sincronizados).
- **Zona** (total/rural/urbano) afecta KPIs de IEIE, comparaciones y variables que lo soporten.
- **Municipio** solo se habilita cuando el departamento tiene municipios con información.
- Al cambiar el estado se **re-renderizan** todos los componentes visibles leyendo del JSON
  correspondiente (no se recalcula desde microdatos).
- `CautionBox` y `SuffChip` aparecen **solo** si el ámbito tiene `suficiencia = insuficiente`
  (no como alerta permanente).

```
[Selector] ─┐
            ├─► setState(ambito, nivel, zona) ─► render(paneles visibles)
[Mapa clic]─┘                                     ├─ KPIs
                                                  ├─ gráficos (ECharts.setOption)
                                                  ├─ mapa (resaltar + recolorear)
                                                  └─ narrativa (reglas)
```

---

## 5. Especificación de gráficos (ECharts)

| Gráfico | Tipo ECharts | Eje/serie | Regla de datos |
|---|---|---|---|
| Ranking territorial | `bar` horizontal, ordenado | y=territorios, x=IEIE 0–100 | resalta ámbito activo; excluye territorios sin IEIE |
| Distribución categorías | `bar` apilado 100% (o barras H) | segmentos Adecuado/Aceptable/Deficiente/Crítico | usa conteos de `dist_categoria`; **sin dona** |
| Comparación rural-urbana | `bar` agrupado | urbano vs rural | null si zona sin datos |
| **Dumbbell dimensiones** | `scatter` + `line` (custom) | por D1–D9: puntos territorio/nacional/rural/urbano conectados | 999 → se omite el punto, no se dibuja como 0 |
| Radar (secundario) | `radar` | D1–D9 | opcional; oculto por defecto o en pestaña plegada |
| Distribución de variable | `bar` | categorías de la variable | muestra n válidas y faltantes |

Reglas transversales: 0–100 fijo donde aplica; el **999 nunca** se grafica como valor;
tooltips muestran etiqueta completa de la dimensión/variable; colores por categoría IEIE
(Adecuado #2f9e8f, Aceptable #7cc0a8, Deficiente #e0a253, Crítico #d0594e).

---

## 6. Especificación de mapas (Leaflet)

- **Capa base:** CARTO light (sin licencia privada) o tiles claros equivalentes.
- **Capa temática:** `geo/departamentos.geojson` (33 features, campo `cod` 2 díg.) unida a
  `resumen_departamental` por `cod`.
- **Métricas coropléticas seleccionables:** IEIE, % rural, % sin agua continua, % sin internet,
  % suspensión de clases (todas desde el JSON).
- **Rampas de color:** IEIE = escala por categorías (verde→rojo, mayor mejor); indicadores de
  carencia = escala secuencial (mayor % = más intenso, peor).
- **Interacción:** hover resalta y muestra tooltip; clic fija el ámbito (cross-filter); popup con
  mini-ficha (IEIE, muestra, cobertura, suficiencia).
- **Suficiencia:** territorios `insuficiente` se marcan con textura/borde distinto y nota
  "estimación con precaución" en el popup.
- **Municipal (futuro):** `SHP_MGN2018_INTGRD_MPIO.zip` (66 MB) → simplificar y publicar solo si
  el peso resultante es aceptable para GitHub Pages; se decide en loop posterior.

---

## 7. Narrativas automáticas (reglas determinísticas)

Plantilla base (sin LLM, sin causalidad, sin calificativos fuera de regla):

> "En **{territorio}**, el IEIE promedio es **{ieie}** ({categoría según rango oficial}).
> La cobertura de la encuesta fue **{cobertura}%** ({muestra}/{marco} sedes).
> Frente al referente nacional ({ieie_nacional}), el resultado está **{por encima/por
> debajo/cerca}** por **{brecha}** puntos. La diferencia rural-urbana es de **{valor}** puntos.
> La dimensión con menor puntaje es **{dim_critica}** y la de mejor resultado **{dim_fuerte}**.
> La interpretación debe hacerse con **{nivel de precaución}** por suficiencia **{estado}**."

Reglas de redacción:
- "por encima / por debajo / cerca": |brecha| < 1 → "cerca"; si no, signo de la brecha.
- Categoría: se toma de los rangos oficiales (Crítico <40, Deficiente 40–<60, Aceptable 60–<80,
  Adecuado 80–100). No se usan adjetivos fuera de esta tabla.
- Precaución: `suficiente` → "precaución estándar"; `insuficiente` → "alta precaución
  (muestra insuficiente para inferencia concluyente)".
- Todos los valores provienen del JSON; el texto es reproducible y verificable.

---

## 8. Entregables de este loop
- `DASHBOARD_ARCHITECTURE.md` (este documento; incluye wireframes, catálogo, flujo, specs).
- `data/glosario_dimensiones.json` (definiciones oficiales para el glosario, sin inventar).
- Actualización de `PROGRESS.md` y `CHANGELOG.md`.
- No se programa aún; la implementación se distribuye en loops siguientes.

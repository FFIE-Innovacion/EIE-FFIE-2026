# ARQUITECTURA_SIG_MAPAS.md — Guía paso a paso para el ingeniero SIG
## Dashboard IEIE FFIE 2026 (v3) · Pestaña "Mapas interactivos"

Este documento describe la **arquitectura funcional y el diseño UX/UI** del componente
cartográfico, y el **flujo paso a paso** que debe seguir un ingeniero SIG para construir,
mantener o extender los mapas interactivos del tablero. La referencia visual/UX son los
visores ArcGIS Experience Builder aportados (solo como inspiración de diseño; nunca como
fuente de datos).

---

## 1. Universo visual de análisis (qué ve el usuario)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOLBAR   [Capa ▾] [Variable ▾ (solo temática)] [Nivel ▾]            │
│           [Buscar territorio…] [Reiniciar vista]                     │
├──────────────────────────────────────────────┬──────────────────────┤
│                                              │ PANEL LATERAL        │
│   LIENZO CARTOGRÁFICO (Leaflet)              │ ┌──────────────────┐ │
│   ┌─────────┐                                │ │ Nombre territorio│ │
│   │ INSET   │   Colombia continental         │ │ IEIE · categoría │ │
│   │ San     │   coropleta por capa activa    │ │ muestra / marco  │ │
│   │ Andrés  │                                │ │ cobertura        │ │
│   └─────────┘                                │ │ dim. crítica     │ │
│   zoom  ·  tooltips  ·  clic = ficha         │ │ chip suficiencia │ │
├──────────────────────────────────────────────┤ └──────────────────┘ │
│ LEYENDA DINÁMICA (cambia con la capa)        │ nota fuente/sufic.   │
│ Nota de fuente y n de casos                  │                      │
└──────────────────────────────────────────────┴──────────────────────┘
```

Principios UX (inspirados en los visores de referencia):
- **Panel lateral persistente** con la ficha del territorio (hover y clic la actualizan).
- **Leyenda siempre visible** y específica de la capa activa.
- **Estados vacíos claros**: "sin dato" y "muestra insuficiente" en **gris neutro**, jamás con
  el mismo color que un valor bajo del indicador.
- **Inset cartográfico** para San Andrés, Providencia y Santa Catalina (no se reposiciona el
  archipiélago; se muestra en recuadro rotulado con su geografía real).
- Fondo de teselas discreto (CARTO light), jerarquía visual institucional FFIE.

---

## 2. Arquitectura de datos y capas

### 2.1 Insumos oficiales
| Insumo | Rol | Archivo publicado |
|---|---|---|
| MGN 2018 DANE — departamentos | Geometría nivel 1 | `geo/departamentos.geojson` (33 features, ~374 KB) |
| MGN 2018 DANE — municipios | Geometría nivel 2 | `geo/municipios.geojson` (1.122 features, ~1,18 MB) |
| Agregados de la encuesta (LOOP 1) | Atributos | `data/resumen_departamental.json`, `data/resumen_municipal.json` |
| Configuración de capas y reglas | Parámetros | `data/config_mapas.json` |

### 2.2 Llave de unión (regla crítica)
- Departamental: `feature.properties.cod` (2 dígitos DANE) ↔ `resumen_departamental.cod`.
- Municipal: `feature.properties.cod5` (5 dígitos DANE = MPIO_CDPMP) ↔ `resumen_municipal.mpio_cod`.
- **Nunca** unir por nombre. Correspondencia verificada: 977/978 municipios con dato tienen
  geometría; el municipio 27493 no cruza y se documenta (no se simula su ubicación).

### 2.3 Capas implementadas
| # | Capa | Tipo de simbología | Fuente del valor |
|---|---|---|---|
| 1 | IEIE promedio | Secuencial por categorías oficiales | `ieie` |
| 2 | Cobertura de la encuesta | Secuencial (azules) | `cobertura_pct` |
| 3 | Perfil rural-urbano | Divergente (brecha U−R) | `ieie_urbano`,`ieie_rural` |
| 4 | Dimensión más crítica | Categórica (9 clases D1–D9) | `dim_critica` |
| 5 | Suficiencia muestral | Binaria (suficiente/insuficiente) | `suficiencia` |
| 6 | Variable temática | Secuencial (% del indicador) | `modulos.*` según selector |
| 7 | Prioridad territorial (exploratoria) | Ordinal 3 clases + neutrales | `prioridad_exploratoria` |
| 8 | Nivel municipal (IEIE/cobertura/suficiencia) | Igual que 1/2/5 | `resumen_municipal` |

### 2.4 Regla de prioridad (transparencia obligatoria)
La clasificación de prioridad **no es oficial**: se denomina "prioridad exploratoria", su regla
vive en `data/config_mapas.json` (umbral Deficiente <60; medio <70; suficiencia ≥30) y se
muestra con aviso. Estados diferenciados: necesidad alta / media / baja (evaluables),
**"No evaluable — requiere fortalecimiento de la muestra"** (insuficiente) y "sin información".
Prioridad ≠ insuficiencia: un territorio con IEIE alto y muestra insuficiente es "no evaluable",
no "baja prioridad".

---

## 3. Flujo paso a paso para el ingeniero SIG

### Paso 1 — Preparación de geometrías (una sola vez o al actualizar MGN)
1. Descargar/obtener shapefiles oficiales MGN (DANE), niveles DPTO y MPIO.
2. Reproyectar a WGS84 (`EPSG:4326`).
3. Conservar SOLO los campos necesarios: código DANE (`DPTO_CCDGO` / `MPIO_CDPMP`) y nombre.
4. **Simplificar** la geometría (Douglas-Peucker; tolerancia usada: 0,008° depto / 0,012° muni)
   verificando que NO se alteren códigos ni desaparezcan features.
5. Exportar a GeoJSON con codificación UTF-8.
6. Presupuesto de peso: depto <500 KB; municipios <1,5 MB (GitHub Pages sirve gzip).

### Paso 2 — Preparación de atributos
1. Los atributos NO viven en el GeoJSON (evita duplicar geometrías por métrica).
2. Se publican agregados validados por territorio en `data/*.json` (ver LOOP 1).
3. Cada registro lleva: código DANE (texto), valor de la métrica, `muestra_valida`,
   `marco_sedes`, `cobertura_pct`, `suficiencia`.

### Paso 3 — Unión en tiempo de ejecución (cliente)
1. Cargar GeoJSON + JSON de atributos por `fetch`.
2. Indexar atributos por código (`depByCod`, `muniByCod`).
3. En el `style` de cada feature, resolver el atributo por código y aplicar la rampa.
4. Nivel municipal: **carga bajo demanda** (solo al seleccionarlo), con mensaje de carga.

### Paso 4 — Simbología y accesibilidad
1. Definir rampas por capa en un solo lugar (función `colorFor`).
2. Reglas fijas: insuficiente → gris `#9aa0a6` con borde punteado; sin dato → lila `#dcd3e4`.
3. Nunca reutilizar el color de "valor bajo" para "insuficiente".
4. Contraste AA en leyenda y etiquetas; textos ≥11 px.

### Paso 5 — Interacción
1. Tooltip: nombre + valor + **n de casos** (obligatorio).
2. Popup: mini-ficha (IEIE, categoría, cobertura, n/marco, advertencia de suficiencia).
3. Clic: sincroniza el panel lateral (y en nivel depto, el estado global del tablero).
4. Búsqueda: datalist por nombre oficial → `fitBounds` a la geometría.
5. Reinicio: restaura capa, nivel, vista y panel.

### Paso 6 — Inset de San Andrés
1. Extraer feature cod 88 del GeoJSON departamental.
2. Renderizarla en un mini-mapa (Leaflet control, esquina superior izquierda) con la MISMA
   simbología de la capa activa.
3. Rotular el recuadro. No mover el archipiélago de su posición real.

### Paso 7 — Verificación (checklist del SIG)
- [ ] Nº de features = nº oficial (33 deptos / 1.122 municipios MGN).
- [ ] Todos los códigos DANE presentes y como texto (ceros a la izquierda intactos).
- [ ] Unión datos↔geometría por código: reportar no-correspondencias (no rellenar por nombre).
- [ ] Leyenda coincide con la rampa efectiva.
- [ ] Tooltips muestran fuente y n.
- [ ] Insuficiente ≠ color de valor bajo.
- [ ] Peso total servible por GitHub Pages y carga municipal bajo demanda.
- [ ] Funciona sin backend (solo estáticos) en servidor local y en Pages.

---

## 4. Decisiones y limitaciones documentadas
- Municipio **27493** (Chocó) con dato pero sin geometría en MGN cargado → se muestra en tablas,
  no en el mapa municipal; pendiente verificar con MGN más reciente.
- El nivel municipal muestra IEIE/cobertura/suficiencia (los agregados municipales disponibles);
  dimensión crítica y temáticas siguen a nivel departamental por disponibilidad de datos.
- Teselas de fondo requieren internet; el dashboard funciona igualmente sin ellas (coropleta
  visible sobre fondo claro).

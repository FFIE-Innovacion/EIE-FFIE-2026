# DATA_DICTIONARY.md — Dashboard IEIE FFIE 2026 (v3)

Diccionario de la capa de datos pública (carpeta `data/` + `geo/`). Todas las cifras se
calculan desde las bases oficiales; ninguna se fija a mano. Convención: `999` = No calculable.

---

## Fuentes oficiales

| Base | Hoja | Filas | Rol |
|---|---|---|---|
| `Poblacion_Total__13_.xlsx` | `Total` | 48.565 sedes únicas | **Marco poblacional** (denominador de cobertura) |
| `FFIE_2026_Base_Unida_IEIE.xlsx` | `ieie_respuestas` | 19.070 (18.897 válidas + 173 atípicos) | **Resultados** de la encuesta e IEIE |

**Llave de unión:** `Total.«Código DANE Sede»` ↔ `ieie_respuestas.«id_codigo_dane_sede»`.
Cruce verificado: 19.070/19.070 (100%) de las sedes de la base existen en el marco.

---

## Identificadores y geografía

| Campo | Tipo | Descripción |
|---|---|---|
| `id_codigo_dane_sede` | texto (12) | Identificador único de sede. Se maneja como texto (no numérico). |
| `cod` | texto (2) | Código DANE de departamento. **En la base de resultados, `enc_departamento` viene como este código numérico, no como nombre** (inconsistencia detectada y resuelta mapeando al nombre del marco). |
| `mpio_cod` | texto (5) | Código DANE de municipio. |
| `nombre` / `departamento` | texto | Nombre oficial del departamento (marco DANE). Bogotá D.C. = Distrito Capital (cod `11`). |
| `zona` / `enc_tipo_de_predio` | categoría | Marco: `RURAL`/`URBANA`. Encuesta: `Rural`/`Urbano`. |

## Índice y dimensiones

| Campo | Tipo | Descripción |
|---|---|---|
| `IEIE_total` → `ieie` | 0–100 | IEIE consolidado. **No se recalcula por sede**; a nivel territorial se promedia. |
| `categoria_ieie` | categoría | `Adecuado`, `Aceptable`, `Deficiente`, `Crítico`. |
| `D1..D9` | 0–100 / 999 | Puntaje por dimensión. `999` = No calculable, excluido de promedios. |
| `dimension_mas_critica` / `_fuerte` | D1–D9 | Dimensión modal por territorio. |
| `Dato_Atipico` | bool | `True` en 173 registros; excluidos de rankings, mapas y promedios. |

## Cobertura y suficiencia

| Campo | Regla |
|---|---|
| `marco_sedes` | Conteo de sedes del marco (denominador). |
| `muestra_valida` | Sedes con IEIE válido (sin atípicos). |
| `cobertura_pct` | `100 × muestra_valida / marco_sedes`. |
| `suficiencia` | `suficiente` si `muestra_valida ≥ 30`; si no, `insuficiente`. |

---

## Archivos publicados (`data/`)

| Archivo | Contenido |
|---|---|
| `resumen_nacional.json` | Marco, muestra válida, atípicos, cobertura, IEIE nacional/urbano/rural, distribución por categoría, promedio por dimensión, conteos territoriales. |
| `resumen_departamental.json` | 33 territorios: cobertura, IEIE, urbano/rural, suficiencia, categoría modal, dimensión crítica/fuerte, promedios D1–D9, distribución, módulos temáticos. Ordenado por IEIE desc. |
| `resumen_municipal.json` | 978 municipios con información: cobertura, IEIE, suficiencia. |
| `perfil_dimensiones.json` | Catálogo D1–D9 con etiqueta, promedio nacional y nº de 999. |
| `resultados_rural_urbano.json` | IEIE urbano/rural nacional y por departamento. |
| `variables_tematicas.json` | Catálogo de módulos temáticos e indicadores de la encuesta. |
| `metadatos_variables.json` | Diccionario técnico de los campos publicados. |
| `suficiencia_muestral.json` | Umbral, suficiencia por departamento y territorios con advertencia. |
| `geo/departamentos.geojson` | 33 departamentos MGN 2018 (simplificado, 374 KB) con `cod` y `nombre`. |

---

## Exclusiones de privacidad (aplicadas)

No se publican, en ningún archivo: `enc_fecha_de_visita`, `enc_nombre_de_la_persona_que_diligencia_la_encuesta`,
`enc_numero_de_celular`, `enc_correo_electronico`, `enc_objectid`, `enc_globalid`, coordenadas
(`enc_latitud_y`, `enc_longitud_x`), ni campos de texto libre con descripciones. La hoja
`EncuestasRecibidas` y las columnas de contacto del marco (`Correo`, `Teléfono`) **no se usan**.
Los XLSX originales **no** se incluyen en la carpeta pública.

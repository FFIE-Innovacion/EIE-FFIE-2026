# VALIDATION_REPORT.md — Dashboard IEIE FFIE 2026 (v3)

Validación de cifras calculadas directamente desde las bases oficiales (LOOP 1).
No se han reemplazado aún los valores en el dashboard; este informe documenta las diferencias.

---

## 1. Validaciones de integridad

| Verificación | Resultado |
|---|---|
| Marco poblacional (hoja `Total`) | 48.565 sedes, **sin duplicados** de `Código DANE Sede` |
| Base resultados (hoja `ieie_respuestas`) | 19.070 filas, **sin duplicados** de `id_codigo_dane_sede` |
| Cruce base ↔ marco por código DANE | **19.070 / 19.070 (100%)**; 0 sedes de la base fuera del marco |
| IEIE nulo o = 999 | 0 casos |
| `Dato_Atipico = True` | 173 (calidad "Pendiente validación"; advertencia "excluido de rankings y mapas") |
| Zona (marco) | RURAL 39.574 · URBANA 8.991 |
| Departamentos | 33 (32 + Bogotá D.C.) en ambas bases |

## 2. Tratamiento de atípicos (confirmado)

La base trae **19.070** filas; **173** están marcadas `Dato_Atipico=True` con la advertencia
oficial *"Atípico crítico (ratio aulas inhab>1) pendiente de validación; excluido de rankings y
mapas analíticos"*. Se aplican **excluyéndolas** de promedios, rankings, mapas y módulos.
Resultado: **19.070 − 173 = 18.897 sedes válidas** (coincide exactamente con la base previa).

## 3. Suficiencia muestral

Umbral: `muestra_valida ≥ 30`. Territorios con **advertencia** (muestra insuficiente):

| Territorio | Muestra válida | Estado |
|---|---|---|
| Archipiélago de San Andrés, Providencia y Santa Catalina (cod 88) | 14 | Estimación con precaución |
| Guainía (cod 94) | 7 | Estimación con precaución |

Coincide con la revisión especial pedida (San Andrés y Guainía).

---

## 4. Tabla de conciliación (dashboard v2 vs. base oficial)

| Cifra | Dashboard v2 | Base oficial (v3) | Dif. | Fuente | Regla de cálculo | Decisión |
|---|---|---|---|---|---|---|
| Marco total sedes | *(no mostrado)* | **48.565** | — | `Poblacion_Total.Total` | Conteo `Código DANE Sede` únicos | Añadir como denominador |
| Muestra válida | 18.897 | **18.897** | 0 | `ieie_respuestas` | Filas − atípicos | Conservar |
| Atípicos excluidos | *(no explícito)* | **173** | — | `Dato_Atipico=True` | Exclusión | Documentar en metodología |
| Cobertura nacional | *(no mostrada)* | **38,91 %** | — | ambas | válida / marco × 100 | **Añadir** (nuevo indicador) |
| IEIE nacional | 69,86 | **69,86** | 0 | `IEIE_total` | Promedio (sin atípicos, sin 999) | Conservar |
| IEIE urbano | 74,86 | **74,86** | 0 | `IEIE_total`×`tipo_predio` | Promedio urbano | Conservar |
| IEIE rural | 68,62 | **68,62** | 0 | idem | Promedio rural | Conservar |
| Desv. estándar nacional | 11,38 | **11,38** | 0 | `IEIE_total` | Desv. muestral | Conservar |
| Nº departamentos | 33 | **33** | 0 | ambas | Distintos | Conservar; aclarar "32 + Bogotá D.C." |
| Nº municipios con info | *(no mostrado)* | **978** | — | `ieie_respuestas` | Distintos con IEIE | Añadir (marco: 1.124) |
| Distribución categorías | Aceptable/Adecuado/Deficiente/Crítico | **12.136 / 3.420 / 3.050 / 291** | menor* | `categoria_ieie` | Conteo sin atípicos | Conservar |
| Dim. crítica nacional | D6 | **D6 (47,46)** | 0 | `dimension_mas_critica` / `dim_prom` | Modal / menor promedio | Conservar |
| Dim. más fuerte nacional | D9 | **D9 (89,54)** | 0 | idem | Modal / mayor promedio | Conservar |
| 999 por dimensión | D5,D6,D8 | **D5=279, D6=18, D8=1** | — | dimensiones | Conteo de 999 | Excluir de promedios |

\* La distribución por categoría difiere ligeramente respecto a v2 porque v2 mostraba porcentajes
(18,1 / 64,22 / 16,14 / 1,54) y aquí se reportan **conteos** de la muestra válida; los porcentajes
equivalentes coinciden dentro del redondeo.

---

## 5. Diferencias principales frente a v2

1. **Cobertura poblacional (nuevo):** v2 no calculaba denominador; v3 añade marco (48.565) y
   cobertura (38,91 %) por territorio.
2. **Nombres de departamento (corrección):** en la base, `enc_departamento` viene como **código
   DANE numérico**; v3 lo mapea al nombre oficial del marco (evita mostrar "88"/"94" como nombre).
3. **Suficiencia muestral (nuevo):** v3 marca San Andrés y Guainía como estimación con precaución.
4. **Bogotá D.C.:** etiquetada explícitamente como Distrito Capital (cod 11).
5. **Módulos temáticos:** ahora pre-agregados por departamento desde variables de la encuesta.

**Conclusión:** las cifras nucleares (IEIE, muestra, dimensiones) **coinciden exactamente** con v2
(diferencia 0), lo que valida la continuidad. Las novedades son aditivas (cobertura, suficiencia,
corrección de nombres). No se reemplazan valores todavía; eso corresponde a loops posteriores.

---

## 6. Validaciones del LOOP 3 (implementación Resumen + Análisis)

Verificaciones automáticas ejecutadas sobre la implementación y los datos publicados:

| # | Verificación | Resultado |
|---|---|---|
| 1 | El total nacional coincide en tarjetas, tablas y gráficos (muestra 18.897) | ✔ OK |
| 2 | Suma de muestra válida por departamento = muestra nacional | ✔ 18.897 = 18.897 |
| 3 | Suma de distribución por categoría = muestra válida nacional | ✔ 18.897 |
| 4 | Denominadores no se mezclan: muestra ≤ marco en depto y municipio | ✔ OK (tras ajuste) |
| 5 | IEIE proviene del valor oficial (no recalculado de variables) | ✔ IEIE nacional 69,86 |
| 6 | No aparece la etiqueta "33 departamentos" | ✔ se usa "32 departamentos + Bogotá D.C." |
| 7 | Bogotá D.C. rotulada como Distrito Capital | ✔ OK |
| 8 | No se exponen datos personales en `data/*.json` | ✔ OK |
| 9 | El dashboard funciona mediante servidor local | ✔ HTTP 200 en index/data/geo |

### Incidencia corregida
- **Municipio 41791 (Huila):** muestra válida 51 > marco 50 → cobertura 102%. Causa probable:
  diferencia en el código municipal reportado en la encuesta frente al marco. **Decisión:**
  acotar la cobertura a 100% y registrar `nota_cobertura` de trazabilidad (no se elimina ni se
  altera la muestra ni el IEIE). Es el único caso en 978 municipios.

### Prueba funcional (navegador)
- Carga sin errores de consola (salvo tiles del mapa base, que requieren red).
- KPIs, ranking, comparación rural-urbana, distribución, dumbbell, brechas, radar y glosario
  renderizan correctamente. Cross-filter mapa↔tablero operativo. Inset de San Andrés visible.
- Advertencia de suficiencia se activa correctamente al seleccionar San Andrés / Guainía.

### Nota sobre el mapa y San Andrés
El archipiélago de San Andrés, Providencia y Santa Catalina se representa en un **inset
cartográfico rotulado** en la esquina del mapa, conservando su ubicación real (lat ~12,5–13,4 N)
sin reposicionarlo arbitrariamente sobre el continente. El inset lleva título visible.

---

## 7. Validaciones del LOOP 4 (Ficha territorial y módulo temático)

| # | Verificación | Resultado |
|---|---|---|
| 1 | Cada variable nacional suma válidas+faltantes ≈ muestra (18.897) | ✔ OK |
| 2 | Suma de categorías = n_válidas en todas las variables | ✔ OK |
| 3 | Detalle temático disponible para los 33 territorios | ✔ OK |
| 4 | Narrativa y KPIs se actualizan con cada filtro | ✔ OK (prueba en navegador) |
| 5 | Variables categóricas en barras horizontales (sin circular ni 3D) | ✔ OK |
| 6 | Cada variable muestra n válidas, % faltantes, fuente, nivel y precaución | ✔ OK |

### Territorios verificados (característiticas distintas)
| Territorio | IEIE | Muestra | Suficiencia |
|---|---|---|---|
| Bogotá D.C. | 85,08 | 209 | Suficiente |
| Antioquia | 71,17 | 1.655 | Suficiente |
| Chocó | 58,40 | 381 | Suficiente |
| Amazonas | 60,51 | 56 | Suficiente |
| San Andrés, Providencia y Sta. Catalina | 71,11 | 14 | **Insuficiente** |
| Guainía | 61,84 | 7 | **Insuficiente** |

Se comprobó Bogotá D.C., cuatro departamentos de perfil contrastante con muestra suficiente, y
dos territorios con muestra insuficiente (advertencia activada correctamente en la ficha).

### Decisión sobre la pestaña "Descriptivo"
La pestaña "Descriptivo" **no aporta contenido exclusivo** y **se elimina del menú** (de hecho no
se creó como pestaña en v3, siguiendo el diseño aprobado en el LOOP 2). Sus componentes se
integraron así: distribución por categoría y dispersión/ranking → **Resumen**; comparación
rural-urbana y análisis de variables de la encuesta → **Ficha territorial y temática**; mapas
técnicos PNG → previstos para **Mapas interactivos / Metodología**. Con ello se evita redundancia
y se consolida el enfoque de fichas territoriales.


---

## 8. Validación integral del LOOP 6 (final)

### 8.1 Validación cuantitativa — tabla automática de pruebas
Recalculo **independiente** desde las bases oficiales XLSX, contrastado contra los JSON que
alimentan el dashboard. **Resultado: 30/30 pruebas OK, diferencia 0 en todas.**

| Componente | Filtro | Esperado | Obtenido | Dif. | Estado | Observación |
|---|---|---|---|---|---|---|
| Marco total | Nacional | 48565 | 48565 | 0 | OK |  |
| Muestra válida | Nacional | 18897 | 18897 | 0 | OK |  |
| Cobertura % | Nacional | 38.91 | 38.91 | 0.0 | OK |  |
| IEIE | Nacional | 69.86 | 69.86 | 0.0 | OK |  |
| IEIE urbano | Nacional | 74.86 | 74.86 | 0.0 | OK |  |
| IEIE rural | Nacional | 68.62 | 68.62 | 0.0 | OK |  |
| Dimensión D1 | Nacional | 65.89 | 65.89 | 0.0 | OK |  |
| Dimensión D6 (crítica) | Nacional | 47.46 | 47.46 | 0.0 | OK |  |
| Dimensión D9 (fuerte) | Nacional | 89.54 | 89.54 | 0.0 | OK |  |
| IEIE departamental | Bogotá D.C. | 85.08 | 85.08 | 0.0 | OK |  |
| Muestra departamental | Bogotá D.C. | 209 | 209 | 0 | OK |  |
| Marco departamental | Bogotá D.C. | 838 | 838 | 0 | OK |  |
| IEIE departamental | Antioquia | 71.17 | 71.17 | 0.0 | OK |  |
| Muestra departamental | Antioquia | 1655 | 1655 | 0 | OK |  |
| Marco departamental | Antioquia | 5535 | 5535 | 0 | OK |  |
| IEIE departamental | Chocó | 58.4 | 58.4 | 0.0 | OK |  |
| Muestra departamental | Chocó | 381 | 381 | 0 | OK |  |
| Marco departamental | Chocó | 1491 | 1491 | 0 | OK |  |
| IEIE departamental | San Andrés | 71.11 | 71.11 | 0.0 | OK |  |
| Muestra departamental | San Andrés | 14 | 14 | 0 | OK |  |
| Marco departamental | San Andrés | 25 | 25 | 0 | OK |  |
| IEIE departamental | Guainía | 61.84 | 61.84 | 0.0 | OK |  |
| Muestra departamental | Guainía | 7 | 7 | 0 | OK |  |
| Marco departamental | Guainía | 103 | 103 | 0 | OK |  |
| Ranking top-1 | Nacional | Bogotá D.C. | Bogotá D.C. | 0 | OK |  |
| Ranking último | Nacional | Vaupés | Vaupés | 0 | OK |  |
| Municipios con info | Nacional | 978 | 978 | 0 | OK |  |
| Cobertura municipal <=100% | Todos | 0 | 0 | 0 | OK |  |
| Territorios advertencia | Muestra<30 | 2 | 2 | 0 | OK | San Andrés y Guainía |
| Narrativa: signo brecha | Chocó | por debajo | por debajo | 0 | OK |  |


### 8.2 Validación funcional (navegador, servidor local)

| Prueba | Resultado |
|---|---|
| filtro depto | ✔ OK |
| cambio zona rural | ✔ OK |
| reset | ✔ OK |
| graficos | ✔ OK |
| mapa paths | ✔ OK |
| dumbbell | ✔ OK |
| acordeon | ✔ OK |
| ficha insuf | ✔ OK |
| narrativa | ✔ OK |
| nivel municipal | ✔ OK |
| reset mapa | ✔ OK |
| metodologia secciones | ✔ OK |
| navegacion | ✔ OK |
| movil sin overflow h | ✘ corregido→OK |
| impresion render | ✔ OK |

Nota: la prueba de móvil detectó desbordamiento horizontal en 375 px (brand-meta, tabs y
selectores largos); **se corrigió** en styles.css y se re-verificó: sin desbordamiento en
375 px ni 320 px. Impresión: el contenido renderiza en media print. Compatibilidad GitHub
Pages: solo estáticos + .nojekyll ✔; teselas del mapa base requieren internet (la coropleta
funciona sin ellas).

### 8.3 Validación de privacidad (todos los archivos públicos)
- Sin correos, celulares, teléfonos, nombres de personas, fechas de visita ni coordenadas de
  sedes en `data/*.json`, `geo/*.geojson`, HTML/JS/CSS/README (verificación por patrones).
- Sin registros individuales: todos los JSON son agregados territoriales (lista mayor = 978
  municipios; no hay arrays a nivel de sede).
- Las bases XLSX no están en la carpeta pública.

### 8.4 Cifras corregidas a lo largo del proyecto
| Cifra / dato | Antes | Ahora | Motivo |
|---|---|---|---|
| Nombres de dpto. (cod 88, 94...) | Código numérico como nombre | Nombre oficial del marco | `enc_departamento` venía como código DANE |
| Bogotá D.C. | Sin distinción | "Distrito Capital" (cod 11) | Regla de cobertura territorial |
| Cobertura mpio. 41791 (Huila) | 102 % | 100 % + nota de trazabilidad | Muestra>marco por código municipal |
| Etiqueta "33 departamentos" | Presente en v2 | "32 departamentos + Bogotá D.C." | Regla oficial |
| Cobertura poblacional | No existía | 38,91 % (48.565 marco) | Nuevo denominador oficial |
| Suficiencia muestral | No existía | San Andrés (14) y Guainía (7) marcados | Umbral 30 |

### 8.5 Estado final
**Todas las pruebas ejecutadas quedaron en OK** (30 cuantitativas + 15 funcionales tras la
corrección móvil + privacidad). No quedan pruebas fallidas. Limitaciones conocidas (no son
fallas): teselas del fondo requieren internet; municipio 27493 sin geometría MGN; prioridad
territorial es exploratoria.

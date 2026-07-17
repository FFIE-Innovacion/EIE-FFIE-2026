# PROGRESS.md — Dashboard IEIE FFIE 2026 (v3)

Control de avance por loops. Leer al iniciar cada loop.

---

## Estado general
- **Proyecto base:** dashboard_ieie_v2_github (auditado en LOOP 0).
- **Destino:** dashboard_ieie_v3_github (evolutivo, no reconstrucción total).
- **Fuentes oficiales cuantitativas:**
  - `Poblacion_Total__13_.xlsx` → marco poblacional (denominador de cobertura).
  - `FFIE_2026_Base_Unida_IEIE.xlsx` → resultados (19.071 filas, 152 cols; incluye atípicos).
  - `dashboard_ieie_v2_github.zip` → base a evolucionar.
- **Insumos de apoyo:** Formulario encuesta (PDF), Informe metodológico (DOCX),
  shapefiles MGN 2018 (DEPTO y MPIO), mapas PNG.

## Decisiones firmes
- Cifras SIEMPRE calculadas desde bases oficiales; nunca fijadas a mano.
- 999 = "No calculable" (excluido de promedios/gráficos).
- IEIE NO se recalcula a nivel individual; se usan los valores consolidados.
- Atípicos: 19.071 (base completa) vs. 18.897 (sin atípicos). Aplicar el tratamiento
  definido por el responsable (pendiente de precisar en LOOP 1).
- Bogotá D.C. = Distrito Capital, no "departamento adicional" sin aclaración.
- Diferenciar suficiencia muestral (estimación con precaución / no evaluable).
- Excluir datos personales (correo, celular, contacto, nombre diligenciador, fecha visita).
- XLSX originales NO van en la carpeta pública.

---

## Loops

### LOOP 0 — Auditoría del proyecto actual ✔ COMPLETADO
- Auditado v2 (estructura, libs, datos, privacidad, pestañas).
- Generados: AUDIT_DASHBOARD.md, PROGRESS.md, CHANGELOG.md.
- Conclusión: el proyecto puede evolucionar sin reconstruirse por completo.
- Decisión Descriptivo: integrar/eliminar como pestaña (no aporta info exclusiva).

### LOOP 1 — Auditoría y preparación de datos ✔ COMPLETADO
- **Marco poblacional:** hoja `Total` de `Poblacion_Total__13_.xlsx` = 48.565 sedes únicas
  (sin duplicados), con Zona RURAL/URBANA. Resto de hojas (EncuestasRecibidas, Hoja3…) tienen
  datos personales → excluidas.
- **Base resultados:** `ieie_respuestas`, 19.070 filas × 152 cols. 173 atípicos
  (`Dato_Atipico=True`) → excluidos. Muestra válida = 18.897.
- **Cruce:** 100% por código DANE de sede. Llave confirmada.
- **Inconsistencia resuelta:** `enc_departamento` viene como código DANE numérico (no nombre);
  se mapea al nombre oficial del marco. Bogotá D.C. = cod 11 (Distrito Capital).
- **Cifras validadas:** cobertura nacional 38,91 %; IEIE 69,86 (urb 74,86 / rur 68,62);
  978 municipios con info (marco 1.124); 999 por dim: D5=279, D6=18, D8=1.
- **Suficiencia:** umbral 30. Advertencia en San Andrés (14) y Guainía (7).
- **JSON generados** en `data/`: resumen_nacional, resumen_departamental, resumen_municipal,
  perfil_dimensiones, resultados_rural_urbano, variables_tematicas, metadatos_variables,
  suficiencia_muestral. **GeoJSON** `geo/departamentos.geojson` (33 deptos, 374 KB).
- **Docs:** DATA_DICTIONARY.md, VALIDATION_REPORT.md (con tabla de conciliación), PROGRESS.md.
- Cifras nucleares coinciden con v2 (dif 0); novedades aditivas (cobertura, suficiencia, nombres).

### LOOP 2 — Arquitectura funcional y diseño UX/UI ✔ COMPLETADO
- **Arquitectura definida:** 5 pestañas (Resumen · Análisis del IEIE · Ficha territorial y
  análisis temático · Mapas interactivos · Metodología y calidad). "Descriptivo" **eliminada**
  e integrada (dispersión→Resumen; rural-urbano→Ficha; PNG→Mapas/Metodología).
- **Resumen (portada):** layout 3 columnas (control · mapa · resumen lateral) + ranking,
  comparación rural-urbana, distribución por categoría en **barras apiladas 100%** (reemplaza
  el anillo). Eliminados: tarjeta de desviación estándar, dona, cifras a mano. Recuadro de
  precaución **condicional** (solo si muestra insuficiente).
- **Análisis del IEIE:** gráfico principal **dumbbell** horizontal (territorio/nacional/rural/
  urbano por dimensión); radar como secundario opcional. Nota metodológica fija. Glosario
  interactivo (acordeón) con definiciones **oficiales** extraídas del informe metodológico.
- **Ficha territorial:** ficha técnica dinámica con filtros (territorio/zona/tipo sede/dimensión/
  variable/categoría), panel por variable, y narrativa automática determinística (sin LLM,
  sin causalidad, sin calificativos fuera de regla).
- **Documentos generados:** DASHBOARD_ARCHITECTURE.md (wireframes, catálogo de componentes,
  flujo de filtros, spec de gráficos y mapas), wireframe visual de la portada,
  `data/glosario_dimensiones.json` (definiciones oficiales).
- No se programó; implementación en loops siguientes.

### LOOP 3 — Implementación de Resumen y Análisis del IEIE ✔ COMPLETADO
- **Implementado (código real, funciona en servidor local):** `index.html`, `styles.css`, `app.js`,
  `.nojekyll`, `assets/logo.svg`. Datos de `data/*.json` + `geo/departamentos.geojson`.
- **Resumen:** layout 3 columnas (control · mapa · KPIs). KPIs: marco, muestra válida, cobertura,
  IEIE (con categoría), dimensión crítica, chip de suficiencia. Ranking territorial (barras H,
  resalta ámbito, textura para muestra insuficiente), comparación rural-urbana, distribución por
  categoría en **barras apiladas 100%**. Sin anillo, sin tarjeta de desviación estándar.
- **Mapa:** Leaflet con Colombia continental + **inset cartográfico de San Andrés** (el archipiélago
  no se reposiciona sobre el continente; se muestra en recuadro rotulado). Leyenda, tooltips,
  popups, patrón/hatch para muestra insuficiente, clic sincroniza el tablero, botón restablecer.
- **Análisis del IEIE:** nota metodológica fija; **dumbbell** por dimensión (territorio vs nacional);
  gráfico de brechas; radar secundario (toggle); KPIs; **glosario interactivo** oficial.
- **Estado compartido:** ámbito (país/depto/municipio) + zona (total/rural/urbano); todos los
  componentes reaccionan al mismo estado; municipio se habilita solo si el depto tiene datos.
- **Metodología:** tablas de categorías y calidad + notas (999, atípicos, cobertura, Bogotá D.C.,
  suficiencia, privacidad).
- **Validaciones:** 9/9 OK. Corregido 1 municipio (41791 Huila, cobertura 102%) → acotada a 100%
  con nota de trazabilidad.
- **Pendiente:** Ficha territorial, Mapas interactivos (pestaña), capa municipal, explorador de sedes.

### LOOP 4 — Ficha territorial y módulo temático ✔ COMPLETADO
- **Implementada la pestaña "Ficha territorial y temática"** (integra la antigua "Descriptivo").
- **Selectores:** país/departamento/municipio + zona + tipo de sede (cobertura educativa) +
  dimensión + variable + categoría.
- **Ficha:** total de sedes (marco), muestra obtenida, cobertura, IEIE, dimensión crítica,
  suficiencia; comparación con el nacional; comparación rural-urbana; narrativa automática
  (se actualiza con cada filtro); alertas (≥50 %) y potencialidades (≤15 %) por umbral.
- **Catálogo de variables** (15 variables de la encuesta) organizado por dimensión/tema. Para
  categóricas: barras horizontales. Cada variable muestra n válidas, % faltantes, fuente, nivel
  geográfico y nota de precaución. Sin gráficos circulares, sin 3D, sin adornos.
- **Datos nuevos:** `data/variables_detalle.json` (distribución por variable, nacional y por 33
  departamentos, con válidas/faltantes).
- **Decisión "Descriptivo":** no existe como pestaña en v3 (se eliminó en el diseño del LOOP 2);
  sus componentes se integraron en Resumen (dispersión/ranking, distribución) y en la Ficha
  (rural-urbano, variables temáticas). Documentado en CHANGELOG y VALIDATION_REPORT.
- **Validación:** 6 territorios contrastantes (Bogotá, Antioquia, Chocó, Amazonas + San Andrés y
  Guainía insuficientes). n_válidas+faltantes ≈ 18.897; suma de categorías == n_válidas.

### LOOP 5 — Mapas interactivos y análisis territorial ✔ COMPLETADO
- **Pestaña "Mapas interactivos"** implementada con panel lateral, toolbar y leyenda dinámica.
- **8 capas:** IEIE, cobertura, perfil rural-urbano (brecha), dimensión crítica, suficiencia
  muestral, variable temática (con selector), prioridad exploratoria; nivel departamental y
  municipal.
- **Nivel municipal:** geometría oficial `geo/municipios.geojson` (MGN 2018, 1.122 municipios,
  1,18 MB, simplificada sin alterar códigos DANE), unida por código DANE exacto (977/978
  municipios con dato; 1 sin geometría: 27493, documentado, no simulado). Carga **bajo demanda**.
- **Prioridad territorial:** regla EXPLORATORIA (no oficial) con umbrales visibles en
  `data/config_mapas.json` (no escondidos en el código). Distingue: necesidad alta/media/baja
  (evaluables), "No evaluable — requiere fortalecimiento de la muestra" (insuficiente) y "sin
  información". No confunde prioridad con insuficiencia (p.ej. Guainía = no evaluable pese a
  IEIE 61,8; Chocó = alta por IEIE bajo con muestra suficiente).
- **Estilo:** insuficiente/sin dato SIEMPRE en gris neutro; nunca el mismo color que "IEIE bajo".
- **Funciones:** cambio de capa/variable/nivel, búsqueda territorial, tooltips con n de casos,
  panel lateral con ficha, leyenda dinámica, zoom, reinicio, dato nacional, nota de fuente y de
  suficiencia, e inset cartográfico de San Andrés.
- **Documento SIG:** entregado esquema de arquitectura funcional y flujo paso a paso para el
  ingeniero SIG (ARQUITECTURA_SIG_MAPAS.md + esquema visual).
- **Prueba:** navegador OK; todas las capas, nivel municipal (1.126 polígonos bajo demanda),
  temática y búsqueda operativas. Sin errores (salvo teselas base, que requieren red).

### LOOP 6 — Metodología, validación integral y paquete para GitHub ✔ COMPLETADO
- **Pestaña Metodología completa** (22 puntos): objetivo, alcance descriptivo, no-causalidad,
  corte, fuentes, unidad de análisis, duplicados, válidos, marco vs muestra, construcción previa
  del IEIE, escala, dimensiones, interpretación, agregaciones, niveles, rural-urbano,
  suficiencia, faltantes (999), autorreporte, precauciones, anonimización y tabla de fuente por
  componente.
- **Validación cuantitativa:** recálculo independiente desde XLSX vs JSON del dashboard →
  **30/30 pruebas OK (dif=0)**. Tabla automática en VALIDATION_REPORT §8.1.
- **Validación funcional:** filtros, tarjetas, gráficos, mapas, tooltips, leyendas, acordeones,
  zona, nivel municipal, reset, navegación, impresión, móvil (overflow corregido en 375/320 px),
  servidor local, GitHub Pages → OK.
- **Privacidad:** sin datos personales ni registros individuales en ningún archivo público.
- **Entrega:** README completo, scripts/preparar_datos.py, docs/ARQUITECTURA_SIG_MAPAS.md
  (pendiente LOOP 5 cerrado), ZIP final.

### Proyecto v3 — CERRADO (pendientes menores en VALIDATION §8.5)

---

## Insumos clave confirmados en LOOP 2
- Definiciones oficiales D1–D9, escala 0–100, categorías (Crítico<40, Deficiente 40–<60,
  Aceptable 60–<80, Adecuado 80–100), niveles de calidad y tratamiento del 999: extraídos del
  Informe Metodológico Ejecutivo IEIE (versión oficial, julio 2026). Guardados en
  `glosario_dimensiones.json`.

## Pendientes / decisiones abiertas
- Definir si la capa de sedes conserva nombre de sede/IE o solo código DANE (para explorador).
- Confirmar si se añade capa municipal al mapa (shapefile MPIO disponible, 66 MB → simplificar).
- Revisar en Chocó/Vichada/Vaupés (IEIE más bajos) si requieren nota de contexto.

### LOOP R2 — Propuesta UX/UI y arquitectura del geovisor ArcGIS ✔ COMPLETADO
- **Verificación previa (a solicitud del usuario):** (1) la base original FFIE_2026_Base_Unida_IEIE.xlsx
  NO fue modificada (montaje solo lectura; lecturas con read_only=True; ningún .save sobre ella);
  (2) las estimaciones del IEIE NO cambiaron (IEIE 69,86; urbano 74,86; rural 68,62; muestra 18.897;
  componentes idénticos a v3_2); (3) sin winsorización silenciosa: el valor extremo de estudiantes
  (5.444.467) se conserva y solo se marca por bandera.
- **Documentos generados:** `Propuesta_Diseno_UX_UI_Geovisor_IEIE_FFIE_2026.docx` y `.pdf` (23 secciones):
  objetivo, audiencias, casos de uso, arquitectura funcional/visual, modelo estrella, esquema de 13 capas,
  llaves DANE, cruces de variables, indicadores, agregaciones, filtros, pop-ups, fichas, gráficos por tipo,
  simbología, suficiencia, escalas/proyecciones, publicación ArcGIS (tabla de equivalencias + pasos),
  privacidad, actualización, control de calidad y anexos.
- **XLSX limpio para ArcGIS:** `Datos_Limpios_IEIE_FFIE_2026_ArcGIS.xlsx` (10 hojas: LEEME, departamentos,
  componentes_depto, municipios, var_categoricas, var_numericas, suficiencia, reglas_agregacion,
  dim_componentes, dim_categorias). Llaves por código DANE (texto).
- **Imágenes:** modelo estrella, arquitectura visual, gráfico por tipo de variable.

### LOOP R3 — Paquete de datos para ArcGIS ✔ COMPLETADO
- **Entregable:** Paquete_SIG_ArcGIS_IEIE_FFIE_2026.zip (independiente del dashboard, 7,6 MB, 132 archivos).
  NO incluye Excel originales ni variables personales.
- **01_xlsx:** Datos_Limpios_Geovisor_ArcGIS_IEIE_FFIE_2026.xlsx con las 18 hojas requeridas
  (README, diccionario_campos, alias_shapefile, reglas_agregacion, departamentos_ieie, municipios_ieie,
  departamentos_zona, componentes_departamento, componentes_municipio, variables_categoricas_dpto/_mpio,
  variables_numericas_dpto/_mpio, cobertura, suficiencia, metadata_capas, advertencias, control_calidad).
- **02_shapefiles:** 9 capas × 2 CRS (WGS84 EPSG:4326 y MAGNA-SIRGAS EPSG:4686), cada una con
  .shp/.shx/.dbf/.prj/.cpg y zipeada individualmente. Nombres de campo cortos (<=10) con alias documentado.
  Códigos DANE como texto (tipo C en DBF), ceros iniciales conservados.
- **03_geojson:** 12 capas en WGS84/UTF-8 + tabla relacionada variables_categoricas_tabla.json (une por cod2,
  evita duplicar geometría). Municipios sin registros = 'Sin información' (no 0).
- **04_metadata:** CATALOGO_CAPAS.xlsx, METADATA_CAPAS.md, GUIA_CARGA_ARCGIS.md, MODELO_RELACIONES_ARCGIS.md.
- **05_simbologia:** rampas por capa (JSON); insuficiente/sin dato en gris (≠ IEIE bajo).
- **06_documentacion:** README_PAQUETE.md + VALIDACION_SIG.xlsx (51/51 pruebas OK).
- **07_scripts:** regenerar_paquete.md.
- **CRS auditado:** original MGN 2018 = EPSG:4686 (MAGNA-SIRGAS); versión web reproyectada a WGS84.
- **Control de calidad:** geometrías válidas, sin vacíos, sin duplicados, códigos texto, correspondencia
  (1 municipio 27493 sin geometría, documentado), consistencia XLSX-SHP-GeoJSON. 51/51 OK.

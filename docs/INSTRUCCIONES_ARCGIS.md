# Carga en ArcGIS — Paquete SIG IEIE FFIE 2026

Usa `Paquete_SIG_ArcGIS_IEIE_FFIE_2026.zip`. Guía completa en 04_metadata/GUIA_CARGA_ARCGIS.md.

## Ruta rápida (ArcGIS Online)
1. Content → New item → sube cada `02_shapefiles/<capa>_WGS84.zip` → «Publish as hosted feature layer».
2. Verifica que cod2/cod5 queden como TEXTO (ya son tipo C en el DBF).
3. Sube `01_xlsx/Datos_Limpios_Geovisor_ArcGIS_IEIE_FFIE_2026.xlsx` como hosted table (o las hojas como CSV).
4. Relaciona `variables_categoricas_tabla` (03_geojson) con `ieie_departamental` por `cod2`.
5. Aplica alias (hoja alias_shapefile) y simbología (05_simbologia/simbologia_capas.json).
6. Arma la app en Experience Builder: mapa central, panel de filtros, ficha permanente (Feature Info + Chart).

## Reglas
- Unir siempre por código DANE (texto). Nunca por nombre.
- Municipios sin registros = «Sin información» (no 0).
- Insuficiente/sin dato en gris (nunca el color de IEIE bajo).
- Para análisis institucional usa los shapefiles `_MAGNA` (EPSG:4686).

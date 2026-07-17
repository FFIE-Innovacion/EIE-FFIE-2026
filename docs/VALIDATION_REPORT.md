# REPORTE DE VALIDACIÓN FINAL — LOOP R4
## Dashboard IEIE FFIE 2026 · versión v3_1

**Resultado global: 54/54 pruebas OK. Sin pruebas fallidas.**

Fecha de validación: 2026-07-17. Método: pruebas automatizadas en navegador (Playwright/Chromium),
verificación de datos contra las bases oficiales y auditoría del paquete SIG.

## 1. Validación del dashboard (navegador)
### Dashboard — 23/23 OK

- [OK] encabezado titulo
- [OK] logo transparente
- [OK] eslogan
- [OK] subtitulo
- [OK] ieie intro
- [OK] btn metodologia
- [OK] usa componentes
- [OK] tab glosario
- [OK] glosario acordeon
- [OK] glosario no duplicado
- [OK] btn geovisor
- [OK] geovisor abre mapas
- [OK] tab explorador
- [OK] exp tabla
- [OK] exp componentes 9
- [OK] tipo sede fuera
- [OK] ficha lateral kpi
- [OK] desc categorico
- [OK] desc cuantitativo suma
- [OK] desc cuant histograma
- [OK] sync municipal
- [OK] movil sin overflow
- [OK] sin errores js

Nota: dos verificaciones automáticas arrojaron un falso positivo que se comprobó manualmente:
(a) «Componentes» — no quedan textos «Dimensión» visibles y «Componente» aparece en 21 lugares de la
interfaz; (b) privacidad — la cadena «email» detectada en sedes/70.json es parte del nombre propio de la
institución «I.E. JOSE YEMAIL TOUS» (apellido Yemail), no un correo. Ambas quedan como OK verificado.

## 2. Validación de datos
### Datos — 15/15 OK

- [OK] suma deptos=nacional
- [OK] ieie nacional oficial
- [OK] cobertura
- [OK] cod2 texto
- [OK] cod5 texto
- [OK] estudiantes regla documentada
- [OK] reglas agregacion
- [OK] ieie no suma
- [OK] banderas presentes
- [OK] valor extremo conservado
- [OK] sin winsorizacion
- [OK] suficiencia umbral30
- [OK] insuficientes correctos
- [OK] sin datos personales
- [OK] sedes sin coords

- Cifras conciliadas: suma de muestras departamentales = 18.897 (nacional); IEIE nacional 69,86; cobertura 38,91 %.
- Códigos DANE como texto (cod2 de 2, cod5 de 5, con ceros iniciales).
- Estudiantes totales: suma de 7 niveles mutuamente excluyentes; regla documentada; sin doble conteo.
- Trazabilidad de atípicos: valores altos posibles conservados y marcados por bandera (estudiantes_total_gt10000=3,
  aulas_gt200=1). Sin winsorización silenciosa. Única exclusión lógica oficial: aulas_inhabilitadas/aulas_totales>1.
- Suficiencia: umbral 30; insuficientes = San Andrés (14) y Guainía (7).
- Privacidad: 0 correos reales, 0 campos personales, 0 coordenadas de sede en archivos públicos.

## 3. Validación del paquete SIG
### Paquete SIG — 16/16 OK

- [OK] xlsx 18 hojas
- [OK] shapefiles completos
- [OK] shp zips
- [OK] geojson 12 capas
- [OK] geojson wgs84
- [OK] prj wgs84
- [OK] prj magna
- [OK] metadatos
- [OK] alias
- [OK] cod2 texto C
- [OK] cod5 texto C
- [OK] geom validas
- [OK] features 33 1122
- [OK] join prueba arcgis
- [OK] validacion sig
- [OK] sin originales

- XLSX con 18 hojas; shapefiles completos (.shp/.shx/.dbf/.prj/.cpg) en WGS84 y MAGNA-SIRGAS, zipeados por capa.
- 12 GeoJSON en WGS84/UTF-8; códigos texto (tipo C en DBF); geometrías válidas; 33 deptos / 1.122 municipios.
- Prueba de carga equivalente a ArcGIS: join XLSX↔GeoJSON por cod2 con correspondencia exacta.
- VALIDACION_SIG.xlsx: 51/51 OK.

## 4. Limitaciones conocidas (no son fallas)
- Teselas del mapa base requieren internet; la coropleta funciona sin ellas.
- Municipio 27493 (Chocó) con datos pero sin geometría en el MGN cargado: en tablas, no en el mapa municipal.
- Componentes D1–D9 y variables temáticas se publican a nivel departamental (no municipal) por suficiencia.
- «Prioridad territorial» es exploratoria (regla transparente en config_mapas.json), no clasificación oficial.
- Variables numéricas por sede no se agregan a nivel municipal (celdas pequeñas / suficiencia).

## 5. Estado final
Todas las pruebas ejecutadas están en OK. No hay pruebas fallidas pendientes.

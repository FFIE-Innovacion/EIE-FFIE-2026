# Dashboard IEIE · FFIE 2026

Tablero web estático de consulta del **Índice de Estado de Infraestructura Educativa (IEIE)**
de las sedes educativas oficiales de Colombia — encuesta FFIE 2026.

**estructura publicada:** `https://ffie-innovacion.github.io/EIE-FFIE-2026/`

---

## 1. Propósito

Presentar de forma **descriptiva** (no causal) el estado de la infraestructura educativa medido
por el IEIE, con lectura nacional, departamental y municipal, comparación rural-urbana, análisis
por dimensión (D1–D9), variables de la encuesta, mapas interactivos y ficha territorial.
Cifras calculadas y validadas desde las bases oficiales; ninguna escrita a mano.

## 2. Estructura del proyecto

```
dashboard_ieie_v3_github/
├── index.html            Página única con 5 pestañas
├── styles.css            Estilos (identidad FFIE, responsivo, accesible)
├── app.js                Lógica: estado de filtros, gráficos ECharts, mapas Leaflet
├── .nojekyll             Obligatorio para GitHub Pages (sirve data/ y geo/ sin procesar)
├── README.md
├── assets/               logo.svg
├── data/                 11 JSON agregados y anonimizados (ver DATA_DICTIONARY)
├── geo/                  departamentos.geojson · municipios.geojson (MGN 2018 simplificado)
├── scripts/              preparar_datos.py (regenera data/ desde las bases oficiales)
└── docs/                 PROGRESS · CHANGELOG · VALIDATION_REPORT · DATA_DICTIONARY ·
                          AUDIT_DASHBOARD · DASHBOARD_ARCHITECTURE · ARQUITECTURA_SIG_MAPAS
```
Nota: se mantiene `styles.css` y `app.js` en la raíz (en lugar de `assets/css|js/`) porque el
proyecto es de archivo único por tipo y así lo consume `index.html`; es equivalente y más simple.

## 3. Fuentes de información

- `Poblacion_Total (13).xlsx` — hoja `Total`: **marco poblacional** (48.565 sedes; denominador).
- `FFIE_2026_Base_Unida_IEIE.xlsx` — hoja `ieie_respuestas`: resultados e IEIE ya calculado
  (19.070 filas; 173 atípicos excluidos → 18.897 válidas).
- MGN 2018 (DANE): shapefiles de departamentos y municipios → GeoJSON simplificado.
- Informe Metodológico Ejecutivo IEIE: definiciones oficiales del glosario.

**Las bases XLSX no forman parte de la carpeta pública** (política de anonimización).

## 4. Requisitos

- Para **ver** el dashboard: un navegador moderno. Publicado en GitHub Pages no requiere nada más.
- Para **regenerar los datos**: Python 3.10+ con `openpyxl` (y `geopandas` solo si se rehace la
  cartografía).

## 5. Preparación de datos (actualización de las bases)

1. Coloca las dos bases XLSX en una carpeta local (no dentro del proyecto público).
2. Ejecuta:
   ```bash
   pip install openpyxl
   python scripts/preparar_datos.py --base FFIE_2026_Base_Unida_IEIE.xlsx --marco "Poblacion_Total (13).xlsx" --out data/
   ```
3. El script recalcula todos los JSON de `data/` aplicando las reglas oficiales:
   exclusión de atípicos (`Dato_Atipico=True`), exclusión del código 999 en promedios,
   mapeo de códigos DANE a nombres del marco, suficiencia (umbral 30) y cobertura.
4. Revisa `docs/VALIDATION_REPORT.md` y vuelve a ejecutar las validaciones antes de publicar.

## 6. Ejecución local

```bash
cd dashboard_ieie_v3_github
python -m http.server 8000
# abrir http://localhost:8000
```
(Abrir `index.html` con doble clic NO funciona: los navegadores bloquean `fetch` de archivos
locales; siempre usa un servidor local.)

## 7. Publicación en GitHub Pages

1. Crea (o usa) un repositorio, p. ej. `EIE-FFIE2026`.
2. Sube TODO el contenido de `dashboard_ieie_v3_github/` a la **raíz** del repositorio
   (index.html debe quedar en la raíz, junto con `.nojekyll` y las carpetas `data/`, `geo/`,
   `assets/`, `docs/`, `scripts/`).
   - Por la web: Add file → Upload files. Para las carpetas, crea primero cada carpeta con un
     archivo `.placeholder` (Create new file → `data/.placeholder`), entra a la carpeta y usa
     Upload files ya dentro de ella; al final borra el `.placeholder`.
3. Settings → Pages → Source: `Deploy from a branch` → rama `main`, carpeta `/ (root)` → Save.
4. Espera 1–2 minutos y abre `https://<usuario>.github.io/<repositorio>/` (Ctrl+F5).

## 8. Solución de errores frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Error al cargar datos: Unexpected token '<'" | Falta una carpeta (`data/` o `geo/`) o un JSON | Verifica que `data/*.json` y `geo/*.geojson` estén en el repo; prueba abrir `…/data/resumen_nacional.json` |
| Página 404 | index.html no está en la raíz, o URL con nombre distinto al repo | index.html en raíz; revisa mayúsculas/guiones del nombre |
| Mapa gris sin fondo | Sin internet o teselas bloqueadas | La coropleta funciona igual; las teselas cargan cuando hay red |
| Cambios no se ven | Caché | Ctrl+F5; espera 1–2 min tras el commit |
| Carpetas no se suben al arrastrar | Limitación del drag&drop web de GitHub | Método `.placeholder` + Upload dentro de la carpeta |

## 9. Privacidad

Solo se publican **agregados territoriales** anonimizados. Sin nombres, correos, teléfonos,
fechas de visita, coordenadas de sedes ni registros individuales. Ver política completa en la
pestaña **Metodología y calidad** y en `docs/DATA_DICTIONARY.md`.

## 10. Limitaciones

- Cobertura parcial del marco (38,91 % nacional): describe a las sedes encuestadas.
- Información autorreportada por las sedes, sin verificación en campo.
- San Andrés y Guainía: muestra insuficiente (<30) → estimación con precaución / no evaluable.
- "Prioridad territorial" es **exploratoria** (regla transparente en `data/config_mapas.json`).
- Municipio 27493 con datos pero sin geometría en el MGN cargado (no aparece en el mapa municipal).
- El tablero es descriptivo: **no** establece relaciones causales.

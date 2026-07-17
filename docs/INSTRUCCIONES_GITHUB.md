# Publicación en GitHub Pages — Dashboard IEIE FFIE 2026 (v3_1)

## 1. Crear el repositorio
1. github.com/new → Owner: tu organización (p. ej. FFIE-Innovacion).
2. Nombre: `dashboard-ieie` (o el que prefieras; anótalo, define la URL final).
3. Público. Marca «Add a README file» (crea la rama main).
4. Create repository.

## 2. Descomprimir y subir el contenido
Descomprime `dashboard_ieie_v3_1_github.zip`. Sube a la RAÍZ del repo:
- Archivos sueltos: index.html, app.js, styles.css, README.md, .nojekyll (Add file → Upload files → Commit).
- Carpetas (assets, data, data/sedes, geo, docs, scripts): por la web, crea cada carpeta con
  «Create new file» → `data/.placeholder`, entra a la carpeta y usa «Upload files» dentro; borra el .placeholder.
  La carpeta `data/sedes/` tiene 33 archivos (uno por departamento): súbelos dentro de `data/sedes/`.

## 3. Activar Pages
Settings → Pages → Source: «Deploy from a branch» → rama `main`, carpeta `/ (root)` → Save.
Espera 1–2 minutos y abre `https://<usuario>.github.io/<repo>/` (Ctrl+F5).

## 4. Verificación
- Abre `…/data/resumen_nacional.json`: si muestra JSON, las carpetas subieron bien.
- Prueba el Explorador de sedes (carga `data/sedes/NN.json` bajo demanda).

## Errores frecuentes
| Síntoma | Causa | Solución |
|---|---|---|
| «Error al cargar datos» | falta una carpeta o un JSON | verifica data/ y geo/ completos |
| 404 | index.html no está en la raíz | muévelo a la raíz |
| Mapa gris | sin internet (teselas) | la coropleta igual funciona |
| Cambios no se ven | caché | Ctrl+F5 |

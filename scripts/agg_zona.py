#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
agg_zona.py — Calcula agregados por zona (urbano/rural/total) a partir de los
archivos de sedes ya publicados (data/sedes/<cod2>.json) e inyecta un bloque
`por_zona` en resumen_nacional.json, resumen_departamental.json y
resumen_municipal.json.

Las cifras de MARCO y COBERTURA por zona se completan solo si se pasa el libro
del marco (--marco), que debe tener en la hoja "Total" una columna "Zona".
Si no se pasa, marco/cobertura por zona quedan en null (pendientes de regenerar).

NO inventa cifras: muestra, IEIE, distribución y dimensiones por zona salen del
conteo real de los registros de sedes; marco/cobertura salen del libro del marco.
"""
import argparse, json, os, glob, collections

DIMS = ["D1","D2","D3","D4","D5","D6","D7","D8","D9"]

def num(v):
    if v is None: return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if f == 999 else f

def prom(a):
    a = [x for x in a if x is not None]
    return round(sum(a)/len(a), 2) if a else None

def zkey(z):
    z = str(z or "").strip().upper()
    if z.startswith("URBAN"): return "urbano"
    if z.startswith("RURAL"): return "rural"
    return None

def nuevo():
    return {"ieie": [], "cat": collections.Counter(),
            "dims": {d: [] for d in DIMS}}

def dim_critica(dim_prom):
    arr = [(d, dim_prom[d]) for d in DIMS if dim_prom.get(d) is not None]
    if not arr: return None
    return sorted(arr, key=lambda x: x[1])[0][0]

def resumen_grupo(g):
    dp = {d: prom(g["dims"][d]) for d in DIMS}
    return {
        "muestra": len(g["ieie"]),
        "ieie": prom(g["ieie"]),
        "dim_prom": dp,
        "dim_critica": dim_critica(dp),
        "dist_categoria": dict(g["cat"]),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data", help="carpeta data/")
    ap.add_argument("--marco", default=None, help="(opcional) libro del marco con columna Zona")
    a = ap.parse_args()
    D = a.data

    # ---- 1) Agregación de la MUESTRA por zona desde los archivos de sedes ----
    nac = {z: nuevo() for z in ("urbano", "rural", "total")}
    dep = collections.defaultdict(lambda: {z: nuevo() for z in ("urbano", "rural", "total")})
    mun = collections.defaultdict(lambda: {z: nuevo() for z in ("urbano", "rural", "total")})

    for f in sorted(glob.glob(os.path.join(D, "sedes", "*.json"))):
        cod2 = os.path.splitext(os.path.basename(f))[0]
        if not cod2.isdigit():
            continue
        for r in json.load(open(f, encoding="utf-8")):
            zk = zkey(r.get("zona"))
            cod5 = str(r.get("cod5") or "").strip()
            ieie = num(r.get("ieie"))
            cat = r.get("cat")
            dvals = r.get("d") or []
            def push(grp):
                if ieie is not None:
                    grp["ieie"].append(ieie)
                if cat:
                    grp["cat"][cat] += 1
                for i, d in enumerate(DIMS):
                    if i < len(dvals):
                        grp["dims"][d].append(num(dvals[i]))
            # total
            push(nac["total"]); push(dep[cod2]["total"])
            if cod5: push(mun[cod5]["total"])
            # zona
            if zk:
                push(nac[zk]); push(dep[cod2][zk])
                if cod5: push(mun[cod5][zk])

    # ---- 2) MARCO por zona (opcional, desde el libro del marco) ----
    marco_nac = {}; marco_dep = collections.defaultdict(dict); marco_mpio = collections.defaultdict(dict)
    if a.marco:
        import openpyxl
        wb = openpyxl.load_workbook(a.marco, read_only=True)
        ws = wb["Total"]
        it = ws.iter_rows(values_only=True)
        hdr = [str(h).strip() if h is not None else h for h in next(it)]
        ix = {h: i for i, h in enumerate(hdr)}
        # localizar columnas (tolerante a variaciones de nombre)
        def find(*cands):
            for c in cands:
                if c in ix: return ix[c]
            for h in hdr:
                if h and any(str(c).lower() in h.lower() for c in cands):
                    return ix[h]
            return None
        col_dane = find("Código DANE Sede", "Codigo DANE Sede", "dane")
        col_mun  = find("Código municipio", "Codigo municipio", "municipio")
        col_zona = find("Zona", "zona", "clase", "Clase")
        if col_zona is None:
            raise SystemExit("No se encontró la columna 'Zona' en la hoja Total del marco.")
        cnt_nac = collections.Counter()
        cnt_dep = collections.defaultdict(collections.Counter)
        cnt_mpio = collections.defaultdict(collections.Counter)
        for row in it:
            if col_dane is not None and row[col_dane] is None:
                continue
            mc = str(row[col_mun]).strip() if col_mun is not None else ""
            if mc.endswith(".0"): mc = mc[:-2]
            mc = mc.zfill(5)
            c2 = mc[:2]
            zk = zkey(row[col_zona])
            cnt_nac["total"] += 1; cnt_dep[c2]["total"] += 1; cnt_mpio[mc]["total"] += 1
            if zk:
                cnt_nac[zk] += 1; cnt_dep[c2][zk] += 1; cnt_mpio[mc][zk] += 1
        wb.close()
        marco_nac = dict(cnt_nac)
        marco_dep = {k: dict(v) for k, v in cnt_dep.items()}
        marco_mpio = {k: dict(v) for k, v in cnt_mpio.items()}
        print("Marco por zona (nacional):", marco_nac)

    def cobertura(muestra, marco):
        if not marco or marco <= 0 or muestra is None: return None
        return round(100.0 * muestra / marco, 2)

    def bloque(grupos, marco_map):
        out = {}
        for z in ("total", "urbano", "rural"):
            b = resumen_grupo(grupos[z])
            mk = marco_map.get(z) if marco_map else None
            b["marco"] = mk
            b["cobertura"] = cobertura(b["muestra"], mk)
            out[z] = b
        return out

    # ---- 3) Inyección en los JSON ----
    # nacional
    pz_nac = bloque(nac, marco_nac)
    rn = json.load(open(os.path.join(D, "resumen_nacional.json"), encoding="utf-8"))
    rn["por_zona"] = pz_nac
    json.dump(rn, open(os.path.join(D, "resumen_nacional.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    # departamental
    rd = json.load(open(os.path.join(D, "resumen_departamental.json"), encoding="utf-8"))
    for d in rd:
        c2 = d["cod"]
        d["por_zona"] = bloque(dep.get(c2, {z: nuevo() for z in ("urbano","rural","total")}),
                               marco_dep.get(c2))
    json.dump(rd, open(os.path.join(D, "resumen_departamental.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    # municipal (bloque reducido: marco, muestra, cobertura, ieie)
    rm = json.load(open(os.path.join(D, "resumen_municipal.json"), encoding="utf-8"))
    for m in rm:
        mc = m["mpio_cod"]
        g = mun.get(mc, {z: nuevo() for z in ("urbano","rural","total")})
        pz = {}
        for z in ("total", "urbano", "rural"):
            rg = resumen_grupo(g[z])
            mk = (marco_mpio.get(mc) or {}).get(z)
            pz[z] = {"marco": mk, "muestra": rg["muestra"],
                     "cobertura": cobertura(rg["muestra"], mk), "ieie": rg["ieie"]}
        m["por_zona"] = pz
    json.dump(rm, open(os.path.join(D, "resumen_municipal.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    print("OK — por_zona inyectado. Nacional muestra:",
          {z: pz_nac[z]["muestra"] for z in ("total","urbano","rural")},
          "| IEIE:", {z: pz_nac[z]["ieie"] for z in ("total","urbano","rural")})

if __name__ == "__main__":
    main()

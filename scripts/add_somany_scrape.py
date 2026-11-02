#!/usr/bin/env python3
"""
Meenakshi Build World — add real Somany products from the full site scrape.

Reads  public/somanyceramics*/somanyceramics/products.csv  (+ its images/ folder)
writes scripts/data/products_extra.csv  (products_overall.csv columns + `finish`)
       public/images/products/<slug>.webp and image_map.json entries.

Only products whose SAP code is not already in products_overall.csv and whose
name does not repeat an existing product are taken. Type comes from the SAP
prefix, floor/wall use from its 4th character (as in the main sheet), size
from the SAP size code, finish from the scraped description. Products with a
known size and finish are taken first; --target caps the catalogue size.

Run  python3 scripts/add_somany_scrape.py --target 6200  then  npm run import:somany
"""
import argparse, csv, glob, json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_somany_products import (CSV_PATH, EXTRA_CSV_PATH, IMG_DIR, ROOT, SIZE_BY_CODE,  # noqa: E402
                                    name_key, slugify)
from add_image_packs import MAP_PATH, fit  # noqa: E402

KIND_BY_PREFIX = {'T11': 'CERAMIC', 'T12': 'CERAMIC', 'T21': 'PVT', 'T22': 'PVT', 'T23': 'PVT',
                  'T31': 'GVT', 'T41': 'HDVT'}
# Scrape "collections" that are really product types, not Somany collections.
GENERIC_COLLECTIONS = {'ceramic', 'vitrified', 'tiles'}


def ascii_slug(text):
    """'KENZO CAFÉ CERAMIC' -> 'kenzo-cafe-ceramic' (URLs and file names stay ASCII)."""
    return slugify(unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--target', type=int, required=True, help='total catalogue size to reach')
    args = ap.parse_args()

    scrape_csv = glob.glob(os.path.join(ROOT, 'public', 'somanyceramics*', 'somanyceramics', 'products.csv'))[0]
    scrape_dir = os.path.dirname(scrape_csv)
    scraped = list(csv.DictReader(open(scrape_csv, encoding='utf-8-sig')))
    main_rows = list(csv.DictReader(open(CSV_PATH, encoding='utf-8-sig')))
    mapping = json.load(open(MAP_PATH))

    # What the catalogue already holds: one product per name among mapped rows.
    known_saps = {re.search(r'sap=(T\w+)', r['product_url']).group(1).upper() for r in main_rows}
    names, current = set(), 0
    for r in main_rows:
        key = name_key(r['name'])
        if r['S.No'] in mapping and key not in names:
            current += 1
        names.add(key)
    need = args.target - current
    if need <= 0:
        sys.exit(f'Catalogue already has {current} products (target {args.target}).')

    candidates = []
    for r in scraped:
        m = re.search(r'-(t\w{15})$', r['product_url'].split('?')[0])
        if not m:
            continue
        sap = m.group(1).upper()
        kind = KIND_BY_PREFIX.get(sap[:3])
        if not kind or sap in known_saps:
            continue
        parts = [x.strip() for x in r['name'].split(' | ')]
        base = re.sub(r'\s+Vitrified Tile$', '', parts[0], flags=re.I).strip().upper()
        coll = parts[1] if len(parts) > 2 and parts[1].lower() not in GENERIC_COLLECTIONS else None
        apps = 'Wall, Floor' if sap[3] in 'FS' else 'Wall'
        name = f'{base} {kind} for {apps}' + (f' — Somany {coll} collection' if coll else '')
        fin = re.search(r'\. ([A-Z][A-Z ]*?) finish', r['original: description'])
        candidates.append(dict(sap=sap, name=name, url=r['product_url'].split('?')[0], finish=fin.group(1) if fin else '',
                               image=os.path.join(scrape_dir, r['image_1_file']), image_url=r['image_1_url'],
                               slug=ascii_slug(f'{base} {kind}'), sized=sap[4:7] in SIZE_BY_CODE))
    # Best-described first: known size, then a stated finish; scrape order otherwise.
    candidates.sort(key=lambda c: (not c['sized'], not c['finish']))

    picked, used_slugs = [], set(mapping.values())
    for c in candidates:
        key = name_key(c['name'])
        if key in names or not os.path.exists(c['image']):
            continue
        names.add(key)
        if c['slug'] in used_slugs:
            c['slug'] = f"{c['slug']}-{c['sap'].lower()}"
        used_slugs.add(c['slug'])
        picked.append(c)
        if len(picked) == need:
            break

    first_no = max(int(r['S.No']) for r in main_rows) + 1
    with open(EXTRA_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['S.No', 'name', 'image_count', 'image_1', 'product_url', 'source_website', 'scraped_at', 'finish'])
        for no, c in enumerate(picked, first_no):
            w.writerow([no, c['name'], 1, c['image_url'], f"{c['url']}?sap={c['sap']}", 'www.somanyceramics.com',
                        '2026-10-10', c['finish']])
            with open(c['image'], 'rb') as src, open(os.path.join(IMG_DIR, c['slug'] + '.webp'), 'wb') as dst:
                dst.write(fit(src.read()))
            mapping[str(no)] = c['slug']

    with open(MAP_PATH, 'w') as f:
        json.dump(dict(sorted(mapping.items(), key=lambda kv: int(kv[0]))), f, indent=0)
        f.write('\n')
    print(f'Catalogue had {current}; added {len(picked)} scraped products (S.No {first_no}-{first_no + len(picked) - 1}) '
          f'of {len(candidates)} candidates -> {current + len(picked)}.')


if __name__ == '__main__':
    main()

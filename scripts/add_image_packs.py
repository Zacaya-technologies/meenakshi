#!/usr/bin/env python3
"""
Meenakshi Build World — unpack Somany image packs into the catalogue.

Reads  public/files/Folder_NN_(AAAA-BBBB).zip   (folders "<S.No>_<slug>/image-1.webp")
and    scripts/data/products_overall.csv
then   writes public/images/products/<slug>.webp for every sheet row that has
       no image yet, and records S.No -> slug in scripts/data/image_map.json.

Rows whose product name repeats an earlier row (the same design under a second
SKU) are skipped, and any image already added for such a row is removed, so
the importer lists each design once. Images over 150 KB are re-encoded.

Run  python3 scripts/add_image_packs.py  then  npm run import:somany
"""
import csv, glob, io, json, os, re, sys, zipfile

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_somany_products import CSV_PATH, EXTRA_CSV_PATH, IMG_DIR, ROOT, name_key  # noqa: E402

PACK_DIR = os.path.join(ROOT, 'public', 'files')
MAP_PATH = os.path.join(ROOT, 'scripts', 'data', 'image_map.json')
MAX_BYTES = 150 * 1024


def fit(data):
    """Return WebP bytes no larger than MAX_BYTES (1000px wide at most)."""
    if len(data) <= MAX_BYTES:
        return data
    im = Image.open(io.BytesIO(data)).convert('RGB')
    if im.width > 1000:
        im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
    for q in (80, 72, 64, 56, 48):
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            break
    return buf.getvalue()


def main():
    rows = list(csv.DictReader(open(CSV_PATH, encoding='utf-8-sig')))
    if os.path.exists(EXTRA_CSV_PATH):  # its images come from add_somany_scrape.py
        rows += list(csv.DictReader(open(EXTRA_CSV_PATH, encoding='utf-8-sig')))
    mapping = json.load(open(MAP_PATH))

    keep, seen = set(), set()
    for r in rows:
        key = name_key(r['name'])
        if key not in seen:
            seen.add(key)
            keep.add(r['S.No'])
    sap = {r['S.No']: re.search(r'sap=(T\w+)', r['product_url']).group(1).lower() for r in rows}

    # Drop duplicate rows that an earlier import already gave an image.
    removed = [no for no in mapping if no not in keep]
    for no in removed:
        slug = mapping.pop(no)
        if slug not in mapping.values():
            path = os.path.join(IMG_DIR, slug + '.webp')
            if os.path.exists(path):
                os.remove(path)

    added = reencoded = 0
    for pack in sorted(glob.glob(os.path.join(PACK_DIR, 'Folder_*.zip'))):
        zf = zipfile.ZipFile(pack)
        for name in zf.namelist():
            m = re.search(r'/(\d{4})_([^/]+)/image-1\.webp$', name)
            if not m:
                continue
            no, slug = str(int(m.group(1))), m.group(2)
            if no in mapping or no not in keep:
                continue
            # Two packs reuse a slug an earlier, different product owns.
            if slug in mapping.values():
                slug = f'{slug}-{sap[no]}'
            data = zf.read(name)
            out = fit(data)
            reencoded += out is not data
            with open(os.path.join(IMG_DIR, slug + '.webp'), 'wb') as f:
                f.write(out)
            mapping[no] = slug
            added += 1

    with open(MAP_PATH, 'w') as f:
        json.dump(dict(sorted(mapping.items(), key=lambda kv: int(kv[0]))), f, indent=0)
        f.write('\n')
    print(f'Added {added} images ({reencoded} re-encoded); removed {len(removed)} duplicate rows; '
          f'{len(mapping)} products have an image.')


if __name__ == '__main__':
    main()

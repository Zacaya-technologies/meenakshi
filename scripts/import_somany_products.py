#!/usr/bin/env python3
"""
Meenakshi Build World — replace the dummy catalogue with the real Somany range.

Reads  scripts/data/products_overall.csv   (the scraped product sheet)
and    public/images/products/<slug>.webp   (one optimised image per product)
and writes straight into tile_marketplace.sqlite:

  1. Deletes every existing (dummy) product together with its images, variants,
     inventory, category links, attributes and reviews.
  2. Removes the dummy curated collections and re-points the "Somany" brand.
  3. Adds any size categories the new range needs that the taxonomy lacked
     (e.g. 800x2600, 800x3000, 1200x2400 slabs, 800x800 PVT, 150x450 cladding).
  4. Inserts each product that has an image, tagged to every main category it
     belongs to (Floor / Wall / Kitchen / Bathroom / Living / Bedroom / ... /
     Vitrified / Ceramic / Countertops) and, inside each, to the matching
     By Area / Application / Size / Design / Type / Finish / Colour / Surface
     children — the same atomic-tag model the API's facet engine uses.

Prices are not in the sheet, so products are stored with price 0 and the UI
shows "Price on Request". Re-running the script is safe: it always starts by
clearing products, and categories it adds are only created when missing.

Usage:  python3 scripts/import_somany_products.py
"""
import csv, json, os, re, sqlite3, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, 'scripts', 'data', 'products_overall.csv')
IMG_DIR = os.path.join(ROOT, 'public', 'images', 'products')
DB_PATH = os.path.join(ROOT, 'tile_marketplace.sqlite')
REPORT_PATH = os.path.join(ROOT, 'scripts', 'data', 'import_report.csv')

# --------------------------------------------------------------------------
# Size code embedded in the Somany SAP code (chars 5-7, e.g. T31F[119]...).
# Verified against somanyceramics.com product pages.
# --------------------------------------------------------------------------
SIZE_BY_CODE = {
    '102': (200, 1200), '107': (300, 300), '111': (300, 450), '113': (300, 600),
    '118': (150, 450), '119': (600, 1200), '120': (600, 600), '124': (800, 800),
    '149': (200, 1200), '220': (300, 300), '230': (800, 1600), '234': (1200, 2400),
    '237': (800, 2400), '243': (1200, 1800), '252': (800, 3000), '275': (800, 2600),
}
# Typical pieces per box by size (industry-standard packing; editable in admin).
PCS_PER_BOX = {
    (200, 1200): 5, (300, 300): 10, (300, 450): 8, (300, 600): 6, (150, 450): 12,
    (600, 1200): 2, (600, 600): 4, (800, 800): 3, (800, 1600): 2, (1200, 2400): 1,
    (800, 2400): 1, (1200, 1800): 1, (800, 3000): 1, (800, 2600): 1,
}
UPPER_TOKENS = {'GVT', 'PVT', 'FP', 'HDVT', 'HL', 'HL01', 'HL02', 'V1', 'V2', 'V3', 'V4', 'MT', 'EL', 'KS', 'FB',
                'IMP', 'HG', 'VC', 'SS', 'CB', 'DC', 'BM', 'GS', 'RT', 'TFX', 'TXF', 'LGN', 'DH', 'VLT', 'GLS',
                'ET', 'S&P', '3D', 'MM', 'LT.', 'PRO', 'A', 'B', 'MCL', 'MR', 'SP'}


def slugify(t):
    t = t.lower().replace('&', ' and ')
    t = re.sub(r'[^\w\s-]', '', t)
    t = re.sub(r'[\s_]+', '-', t.strip())
    return re.sub(r'-+', '-', t).strip('-')


def title_case(base):
    out = []
    for w in base.split():
        u = w.upper()
        if u in UPPER_TOKENS or re.fullmatch(r'\d+[A-Z]*', u) or re.fullmatch(r'HL[\-\d]*', u):
            out.append(u)
        else:
            out.append('-'.join(p[:1].upper() + p[1:].lower() for p in w.split('-')))
    return ' '.join(out)


def has(tokens, *words):
    return any(w in tokens for w in words)


# --------------------------------------------------------------------------
# Attribute inference from the product name
# --------------------------------------------------------------------------
COLOR_WORDS = [
    ('white', ['WHITE', 'BIANCO', 'BRANCA', 'SNOW', 'GLACIER', 'ICE', 'FROSTY', 'FREEZE', 'ALBINO', 'BLANCO', 'NIVEA', 'STATUARIO', 'STATURIO', 'STVARIO', 'CARARA', 'CARRARA', 'CALACATTA', 'CALCUTTA', 'PANDA']),
    ('black', ['BLACK', 'NERO', 'NEGRO', 'PRETO', 'COAL', 'NIGHT', 'ANTRACITA', 'MARQUINA']),
    ('grey', ['GREY', 'GRIS', 'GRIGIO', 'GRIGE', 'ASH', 'SILVER', 'SMOG', 'FOG', 'MIST', 'ARGENT', 'TITANIO', 'HAZE', 'STERLING', 'GRAPHITE', 'CEMENT', 'SLATE', 'GRAFITO', 'SCURO']),
    ('ivory', ['IVORY', 'BONE', 'TUSK']),
    ('cream', ['CREMA', 'CREAM', 'BUTTER', 'MARFIL']),
    ('beige', ['BEIGE', 'SAND', 'SAHARA', 'ALMOND', 'BARLEY', 'OYSTER', 'MUSHROOM', 'SANDSTONE', 'TAUPE', 'NATURAL', 'NATURA', 'DAINO', 'BERLY']),
    ('brown', ['BROWN', 'BRUNO', 'MARRON', 'COCOA', 'COFFEE', 'MOCHA', 'TEAK', 'WALNUT', 'WENGE', 'MAHOGANY', 'NUT', 'RUST', 'TAN', 'EARTH', 'CORTEN', 'COPPER', 'BRONZE', 'BRONCE', 'OAK', 'MAPLE', 'HONEYWOOD', 'BURLWOOD', 'CHESTER', 'ROBBLE']),
    ('gold', ['GOLD', 'ORO', 'AUREA', 'GOLDEN']),
    ('sky-blue', ['SKY']),
    ('aqua', ['AQUA', 'TEAL']),
    ('blue', ['BLUE', 'AZUL', 'AZURE', 'AZZURRO', 'OCEAN', 'SEA', 'INDIGO', 'SAPHIRE', 'ZAFFIRO']),
    ('green', ['GREEN', 'VERDE', 'OLIVE', 'SAGE', 'JADE', 'EMERALD', 'BASIL']),
    ('red', ['RED', 'ROSSO', 'RUBINO', 'MAROON', 'GARNET']),
    ('pink', ['PINK', 'ROSE', 'ROSA', 'ROSATO', 'BLUSH', 'ROSEATE', 'ROSABELA', 'ROSSALIA']),
    ('yellow', ['YELLOW', 'CITRINE', 'CITRON', 'OCHRE', 'OCRE']),
    ('orange', ['ARANCETTO', 'ORANGE']),
    ('terracotta', ['TERRACOTTA', 'COTTO', 'COTTA']),
    ('purple', ['LILAC', 'PURPLE', 'VIOLET']),
]
DESIGN_WORDS = [
    ('wooden', ['WOOD', 'TEAK', 'OAK', 'WALNUT', 'WENGE', 'MAPLE', 'PINE', 'MAHOGANY', 'BURLWOOD', 'HONEYWOOD', 'ROVERE', 'WOODAK', 'MADERA', 'CASK', 'LAMBRIS', 'SERENEWOOD', 'PANELO']),
    ('moroccan', ['MOROCCAN']),
    ('terrazzo', ['TERAZZO', 'TERRAZO', 'TERRAZZO', 'CHIPS']),
    ('3d', ['3D']),
    ('mosaic', ['MOSAICO', 'MOSAIC']),
    ('geometric', ['CUBOID', 'HIVE', 'GEOMETRIC']),
    ('floral', ['FLORA', 'FLORUIT', 'FLEURINE', 'PAISLEY', 'FLOS']),
    ('onyx', ['ONYX', 'ONIX', 'ONICE', 'ONICITA']),
    ('statuario', ['STATUARIO', 'STATURIO', 'STVARIO']),
    ('carrara', ['CARARA', 'CARRARA']),
    ('granite', ['GRANITE', 'GRANITA', 'GRANELLA', 'GALAXY', 'COSMIC', 'MAUNTAIN']),
    ('concrete', ['CEMENT', 'CONCRETE', 'MORTAR', 'MORTERO', 'URBAN', 'SMOG', 'BETON']),
    ('stone', ['STONE', 'SLATE', 'SANDSTONE', 'BASALT', 'TECHSTONE', 'PIETRA', 'GRITSTONE', 'LAVA', 'COBBLE', 'GEOSTONE', 'EVERSTONE', 'ETERNASTONE', 'SEDIMENTO', 'BRITTSTONE', 'ROCKEN', 'ROCKSTONE', 'SILEX', 'PIZARRA', 'GEMSTONE', 'FELSEN']),
    ('marble', ['CALACATTA', 'CALCUTTA', 'BRECCIA', 'MARQUINA', 'PALISSANDRO', 'VENATO', 'ARBASCATO', 'PERLATO', 'ARMANI', 'PANDA', 'DAINO', 'EMPERADOR', 'BOTTICHINO', 'VOLACAS', 'MARBLE', 'MARBO', 'AMAZONA', 'ROMANO', 'CITADEL', 'OROBICO', 'OSSIGENO', 'HEMARUS', 'ALASKA', 'ARGOS', 'QUARTZ', 'TRAVERTINE']),
]


# Words that only *suggest* a colour (marble/stone names) — used when the name
# carries no explicit colour word.
IMPLIED = {'STATUARIO', 'STATURIO', 'STVARIO', 'CARARA', 'CARRARA', 'CALACATTA', 'CALCUTTA', 'NATURAL', 'NATURA',
           'BERLY', 'DAINO', 'SCURO', 'CEMENT', 'SLATE', 'SANDSTONE', 'MARQUINA', 'COPPER', 'BRONZE', 'BRONCE',
           'CORTEN', 'EARTH', 'RUST', 'OAK', 'MAPLE', 'HONEYWOOD', 'BURLWOOD', 'CHESTER', 'ROBBLE', 'TEAK',
           'WALNUT', 'WENGE', 'MAHOGANY', 'MUSHROOM', 'OYSTER'}


def infer_color(tok, name_upper):
    if 'BRICK' in tok and 'RED' in tok:
        return 'red'
    explicit, implied = [], []
    for key, words in COLOR_WORDS:
        for w in words:
            if w in tok:
                (implied if w in IMPLIED else explicit).append(key)
    explicit = list(dict.fromkeys(explicit))
    implied = list(dict.fromkeys(implied))
    s = set(explicit)
    if 'PANDA' in tok or ('black' in s and 'white' in s):
        return 'black-and-white'
    if 'gold' in s and 'black' in s:
        return 'black-and-gold'
    if 'gold' in s and ('white' in s or 'white' in implied):
        return 'white-and-gold'
    if 'grey' in s and 'white' in s:
        return 'grey-and-white'
    if explicit:
        return explicit[0]
    if implied:
        return implied[0]
    return None


def infer_design(tok, kind, is_wall_ceramic):
    for key, words in DESIGN_WORDS:
        if any(w in tok for w in words):
            return key
    if has(tok, 'DECOR', 'DECO', 'HL', 'HL01', 'HL02') or any(t.startswith('HL') for t in tok):
        return 'highlighter'
    if has(tok, 'TONES', 'COOL') or 'PLAIN' in tok:
        return 'plain'
    if kind == 'italmarmi':
        return 'pattern'
    if is_wall_ceramic:
        return 'digital'
    if kind in ('pvt',):
        return 'plain' if has(tok, 'MATT') else 'marble'
    return 'marble'


def infer_finish(tok, kind, code, wall_only):
    if has(tok, 'CARVO', 'CARVING', 'SHAPE', 'ENGRAVO', 'ENGRAVE', 'GLAM', 'INTAGLIO'):
        return 'carving'
    if has(tok, 'GRITSTONE', 'GRIT', 'RUSTIC') or (has(tok, 'STRIO') and has(tok, 'VALOR', 'ROVERE')):
        return 'rustic'
    if has(tok, 'LUCIDO', 'HG', 'GLOSSY', 'GLEAM', 'LUSTRO'):
        return 'high-gloss'
    if has(tok, 'MATT', 'MT', 'QUILL', 'SOFT', 'OPACO', 'LEVIGATO'):
        return 'matt'
    if has(tok, 'FP', 'POLISH', 'NANO'):
        return 'glossy' if kind == 'ceramic' else 'polished'
    if kind == 'slab' and code in ('237', '252', '275'):
        return 'polished'           # 24/26/30 slabs ship full-polished unless marked
    if kind == 'ceramic' and wall_only:
        return 'glossy'
    if kind == 'italmarmi':
        return 'glossy' if has(tok, 'LUCIDO') else 'matt'
    return 'matt'


def infer_kind(last):
    return {'GVT': 'gvt', 'SLAB': 'slab', 'PVT': 'pvt', 'CERAMIC': 'ceramic', 'ITALMARMI': 'italmarmi', 'HDVT': 'hdvt'}[last.upper()]


# --------------------------------------------------------------------------
# Category resolution against the live taxonomy
# --------------------------------------------------------------------------
STRIP_SUFFIXES = ['-mm-vitrified-tiles', '-vitrified-tiles', '-ceramic-tiles', '-parking-tiles', '-tiles',
                  '-type', '-finish', '-material', '-countertops']
ALIASES = {
    'high-gloss': ['high-gloss', 'hi-gloss', 'glossy'],
    'polished': ['polished', 'glossy'],
    'glossy': ['glossy', 'polished'],
    'carving': ['carving', 'texture', 'matt'],
    'rustic': ['rustic', 'matt'],
    'matt': ['matt', 'satin-matt', 'satin'],
    'statuario': ['statuario', 'marble'],
    'carrara': ['carrara', 'marble'],
    'onyx': ['onyx', 'marble'],
    'marble': ['marble', 'marble-effect'],
    'granite': ['granite', 'stone'],
    'concrete': ['concrete', 'cement', 'concrete-finish', 'stone'],
    'stone': ['stone', 'stone-effect', 'texture'],
    'terrazzo': ['terrazzo', 'pattern'],
    'wooden': ['wooden', 'wood-effect'],
    'highlighter': ['highlighter', 'designer', 'pattern', 'digital', 'texture'],
    'glazed-vitrified': ['glazed-vitrified', 'glazed'],
    'digital': ['digital', 'texture', 'plain'],
    'pattern': ['pattern', 'designer', 'digital', 'texture'],
    'floral': ['floral', 'flower', 'pattern', 'designer', 'texture'],
    'geometric': ['geometric', 'pattern', 'designer', 'texture'],
    'plain': ['plain', 'texture'],
    'moroccan': ['moroccan', 'pattern'],
    'mosaic': ['mosaic'],
    '3d': ['3d'],
    'cream': ['cream', 'beige'], 'ivory': ['ivory', 'cream', 'beige'],
    'sky-blue': ['sky-blue', 'blue'], 'aqua': ['aqua', 'blue'], 'gold': ['gold', 'beige'],
    'terracotta': ['terracotta', 'brown'], 'white-and-gold': ['white-and-gold', 'white'],
    'black-and-gold': ['black-and-gold', 'black'], 'black-and-white': ['black-and-white', 'white'],
    'grey-and-white': ['grey-and-white', 'grey'], 'red': ['red', 'terracotta'], 'orange': ['orange', 'terracotta'],
    'purple': ['purple', 'pink'], 'yellow': ['yellow', 'cream'],
}


def norm_slug(slug, main_slug):
    s = slug
    for suf in STRIP_SUFFIXES:
        if s.endswith(suf) and s != suf.strip('-'):
            s = s[: -len(suf)]
            break
    return s


class Taxonomy:
    def __init__(self, con):
        self.con = con
        self.groups = {r[1]: r[0] for r in con.execute('SELECT id, group_key FROM category_groups')}
        self.mains = {r[1]: r[0] for r in con.execute('SELECT id, slug FROM categories WHERE parent_id IS NULL')}
        self.children = defaultdict(lambda: defaultdict(dict))   # main_slug -> group -> {norm: id}
        self.slugs = defaultdict(dict)                           # main_slug -> {slug: id}
        self.created = []
        for cid, slug, name, pid, gid, comp in con.execute(
                'SELECT c.id, c.slug, c.name, c.parent_id, g.group_key, c.composite_filters FROM categories c '
                'LEFT JOIN category_groups g ON g.id = c.group_id WHERE c.parent_id IS NOT NULL AND c.status = "active"'):
            if comp:
                continue
            main = self._main_slug(pid)
            self.slugs[main][slug] = cid
            if gid == 'size':
                m = re.search(r'(\d+)\s*x\s*(\d+)', name.lower())
                key = f'{m.group(1)}x{m.group(2)}' if m else norm_slug(slug, main)
            else:
                key = norm_slug(slug, main)
            self.children[main][gid].setdefault(key, cid)

    def _main_slug(self, pid):
        for s, i in self.mains.items():
            if i == pid:
                return s

    def find(self, main, group, value):
        g = self.children[main].get(group, {})
        for cand in ALIASES.get(value, [value]):
            if cand in g:
                return g[cand]
        return None

    def by_slug(self, main, slug):
        return self.slugs[main].get(slug)

    def ensure_size(self, main, w, h):
        key = f'{w}x{h}'
        g = self.children[main].get('size', {})
        if key in g:
            return g[key]
        # Imperial aliases used by some menus.
        alias = {'600x600': '2x2', '600x1200': '2x4', '300x300': '1x1'}.get(key)
        if alias and alias in g:
            return g[alias]
        # Create it following the naming style of that main category.
        main_id = self.mains[main]
        existing = [s for s in self.slugs[main] if re.match(r'^\d+x\d+', s)]
        if main == 'ceramic-tiles':
            name, slug = f'{key} mm Ceramic Tiles', f'{key}-ceramic-tiles'
        elif main == 'vitrified-tiles':
            name, slug = f'{key} mm Vitrified Tiles', f'{key}-mm-vitrified-tiles'
        elif main == 'parking-tiles':
            name, slug = f'{key} mm Parking Tiles', f'{key}-parking-tiles'
        else:
            name, slug = f'{key} mm', key
        order = (self.con.execute('SELECT COALESCE(MAX(display_order),0)+1 FROM categories WHERE parent_id=? AND group_id=?',
                                  (main_id, self.groups['size'])).fetchone()[0])
        ctype = self.con.execute('SELECT category_type FROM categories WHERE id=?', (main_id,)).fetchone()[0]
        cur = self.con.execute(
            'INSERT INTO categories (name, slug, parent_id, group_id, category_type, status, display_order, seo_title, seo_description) '
            'VALUES (?,?,?,?,?,"active",?,?,?)',
            (name, slug, main_id, self.groups['size'], ctype, order,
             f'{name} | Meenakshi Build World', f'Shop {name} at Meenakshi Build World.'))
        cid = cur.lastrowid
        self.children[main]['size'][key] = cid
        self.slugs[main][slug] = cid
        self.created.append((main, name, slug))
        return cid


# --------------------------------------------------------------------------
# Main-category placement rules
# --------------------------------------------------------------------------
def plan_product(p, tax):
    """Return {main_slug: {group: [values or ('slug', s)]}} for one product."""
    k, tok, w, h = p['kind'], p['tokens'], p['w'], p['h']
    floor, wall, counter = p['floor'], p['wall'], p['counter']
    finish, design, color = p['finish'], p['design'], p['color']
    big = w * h >= 600 * 1200
    slab = k == 'slab' or w * h >= 1200 * 1800 or max(w, h) >= 2400
    vitrified = k in ('gvt', 'slab', 'pvt', 'hdvt')
    cladding = p['cladding']
    small_floor = floor and (w, h) == (300, 300)
    heavy = k == 'hdvt'
    plank = (w, h) == (200, 1200)
    wall_ceramic = k == 'ceramic' and wall and not floor
    polished = finish in ('polished', 'high-gloss', 'glossy')

    if k == 'pvt':
        vtype = 'full-body' if (has(tok, 'FB') or 'homogenea' in (p['collection'] or '').lower()) else 'double-charge'
    elif has(tok, 'NANO') or p['code'] == '243' and tok & {'15'}:
        vtype = 'nano'
    elif k in ('gvt', 'slab'):
        vtype = 'pgvt' if polished else 'gvt'
    else:
        vtype = None
    generic_type = {'gvt': 'vitrified', 'slab': 'vitrified', 'pvt': 'vitrified', 'hdvt': 'vitrified',
                    'ceramic': 'ceramic', 'italmarmi': 'designer'}[k]
    specific_type = {'full-body': 'full-body-vitrified', 'double-charge': 'double-charge-vitrified',
                     'nano': 'nano', 'pgvt': 'glazed-vitrified', 'gvt': 'glazed-vitrified'}.get(vtype)
    if k == 'ceramic':
        specific_type = 'glazed' if not wall_ceramic else 'digital'
    if k == 'slab' and 'porcelain' in (p['collection'] or '').lower():
        specific_type = 'porcelain'

    base = {'design': [design], 'finish': [finish], 'color': [color] if color else [],
            'type': [t for t in (generic_type, specific_type) if t]}
    plan = {}

    def add(main, extra):
        if main not in tax.mains:
            return
        d = {g: list(v) for g, v in base.items()}
        for g, v in extra.items():
            d.setdefault(g, [])
            d[g] += v
        plan[main] = d

    # --- Floor Tiles -----------------------------------------------------
    if floor:
        areas = []
        if heavy:
            areas += ['parking-floor-tiles', 'outdoor-floor-tiles', 'garage-floor-tiles', 'industrial-floor-tiles', 'pathway-floor-tiles', 'commercial-floor-tiles']
        elif small_floor:
            areas += ['bathroom-floor-tiles', 'balcony-floor-tiles', 'terrace-floor-tiles', 'outdoor-floor-tiles', 'porch-floor-tiles']
        else:
            areas += ['living-room-floor-tiles', 'bedroom-floor-tiles', 'dining-room-floor-tiles']
            if big and polished:
                areas += ['drawing-room-floor-tiles', 'hotel-floor-tiles']
            if k == 'pvt' or (w, h) == (600, 600):
                areas += ['hallway-floor-tiles', 'office-floor-tiles', 'commercial-floor-tiles', 'school-floor-tiles', 'hospital-floor-tiles']
            if (w, h) in ((600, 600), (600, 1200)) and finish in ('matt', 'rustic', 'carving'):
                areas += ['kitchen-floor-tiles']
            if slab:
                areas += ['commercial-floor-tiles', 'office-floor-tiles']
            if plank:
                areas += ['hallway-floor-tiles']
            if design == 'statuario' or (design in ('marble', 'onyx') and color in ('white', 'white-and-gold') and polished):
                areas += ['pooja-room-floor-tiles']
        add('floor-tiles', {'area': [('slug', a) for a in areas]})

    # --- Wall Tiles ------------------------------------------------------
    if wall:
        areas = []
        if cladding:
            areas += ['elevation-wall-tiles', 'exterior-wall-tiles', 'outdoor-wall-tiles', 'feature-wall-tiles']
        elif wall_ceramic or k == 'italmarmi' or (wall and not floor):
            areas += ['bathroom-wall-tiles', 'kitchen-wall-tiles', 'interior-wall-tiles']
            if design in ('highlighter', 'pattern', 'floral', 'geometric', '3d', 'moroccan') or k == 'italmarmi':
                areas += ['feature-wall-tiles', 'accent-wall-tiles', 'living-room-wall-tiles']
        else:
            areas += ['living-room-wall-tiles', 'interior-wall-tiles', 'feature-wall-tiles']
            if slab or big:
                areas += ['tv-unit-wall-tiles', 'bathroom-wall-tiles', 'bedroom-wall-tiles']
            if slab:
                areas += ['lobby-wall-tiles', 'reception-wall-tiles', 'hotel-wall-tiles']
            if heavy or k == 'pvt':
                areas += ['commercial-wall-tiles', 'office-wall-tiles']
            if design == 'statuario':
                areas += ['pooja-room-wall-tiles']
        add('wall-tiles', {'area': [('slug', a) for a in areas]})

    # --- Kitchen Tiles ---------------------------------------------------
    if (wall_ceramic or k == 'italmarmi') and not cladding and (w, h) != (300, 300):
        app = ['kitchen-backsplash-tiles', 'stove-area-tiles', 'sink-area-tiles']
        if design in ('highlighter', 'pattern', 'floral', 'geometric', 'moroccan') or k == 'italmarmi':
            app += ['kitchen-feature-wall-tiles', 'kitchen-accent-wall-tiles']
        add('kitchen-tiles', {'area': [('slug', 'kitchen-wall-tiles')], 'application': [('slug', a) for a in app]})
    elif floor and (w, h) in ((600, 600), (600, 1200)) and finish in ('matt', 'rustic', 'carving') and not heavy:
        add('kitchen-tiles', {'area': [('slug', 'kitchen-floor-tiles')]})

    # --- Bathroom Tiles --------------------------------------------------
    if (wall_ceramic or k == 'italmarmi') and not cladding:
        app = ['bathroom-wall-tiles', 'full-wall-bathroom-tiles', 'shower-area-tiles']
        if design in ('highlighter', 'pattern', 'floral', 'geometric', 'moroccan') or k == 'italmarmi':
            app += ['accent-wall-bathroom-tiles', 'feature-wall-bathroom-tiles']
        add('bathroom-tiles', {'application': [('slug', a) for a in app]})
    elif small_floor and not heavy:
        add('bathroom-tiles', {'application': [('slug', a) for a in ('bathroom-floor-tiles', 'shower-floor-tiles', 'wet-area-tiles')]})
    elif wall and (slab or big) and polished and not cladding and not heavy:
        add('bathroom-tiles', {'application': [('slug', a) for a in ('bathroom-wall-tiles', 'feature-wall-bathroom-tiles', 'vanity-area-tiles')]})

    # --- Living room family (floor-grade, non-heavy, not tiny) -----------
    living_floor = floor and not heavy and not small_floor
    if living_floor or (wall and (slab or big) and not cladding and not heavy):
        extra = {'area': [], 'application': []}
        if living_floor:
            extra['area'].append(('slug', 'living-room-floor-tiles'))
        if wall and (slab or big):
            extra['area'].append(('slug', 'living-room-wall-tiles'))
            extra['application'] += [('slug', 'tv-unit-tiles'), ('slug', 'feature-wall-tiles')]
        if slab or max(w, h) >= 1600:
            extra['design'] = ['large-format']
        add('living-room-tiles', extra)
        if living_floor:
            add('bedroom-tiles', {'area': [('slug', 'bedroom-floor-tiles')]})
            add('dining-room-tiles', {'area': [('slug', 'dining-room-floor-tiles')]})
            if k == 'pvt' or plank or (w, h) == (600, 1200):
                add('hallway-tiles', {'area': [('slug', 'hallway-floor-tiles')]})
            if big and polished:
                add('drawing-room-tiles', {'area': [('slug', 'drawing-room-floor-tiles')]})
            if design == 'statuario' or (design in ('marble', 'onyx') and color in ('white', 'white-and-gold') and polished):
                add('pooja-room-tiles', {'area': [('slug', 'pooja-room-floor-tiles')] + ([('slug', 'pooja-room-wall-tiles')] if wall else [])})

    # --- Outdoor / Parking ----------------------------------------------
    if cladding:
        add('outdoor-tiles', {'application': [('slug', 'elevation-wall-tiles'), ('slug', 'outdoor-wall-tiles')], 'surface': [('slug', 'wall')]})
    elif heavy or small_floor:
        app = ['outdoor-floor-tiles', 'terrace-tiles', 'balcony-tiles', 'porch-tiles']
        if heavy:
            app += ['paving-tiles', 'pathway-tiles', 'outdoor-parking-tiles']
        add('outdoor-tiles', {'application': [('slug', a) for a in app], 'surface': [('slug', 'floor')]})
    if heavy or (small_floor and k != 'ceramic' and finish == 'matt' and has(tok, 'KALAHARI')):
        ptype = ['heavy-duty', 'high-load-bearing'] if heavy else []
        add('parking-tiles', {'area': [('slug', 'parking-floor-tiles'), ('slug', 'outdoor-parking-tiles')],
                              'application': [('slug', 'driveway-tiles'), ('slug', 'garage-tiles')],
                              'type': ptype, 'surface': [('slug', 'floor')]})

    # --- Material mains -------------------------------------------------
    surfaces = ([('slug', 'floor')] if floor else []) + ([('slug', 'wall')] if wall else [])
    if k == 'ceramic':
        areas = (['ceramic-floor-tiles'] if floor else []) + (['ceramic-wall-tiles'] if wall else [])
        if wall_ceramic or small_floor:
            areas += ['ceramic-bathroom-tiles']
        if wall_ceramic:
            areas += ['ceramic-kitchen-tiles']
        if floor and not small_floor:
            areas += ['ceramic-living-room-tiles']
        if cladding or small_floor:
            areas += ['ceramic-outdoor-tiles']
        ctype = ['designer' if design in ('highlighter', 'pattern') else 'digital', 'glazed']
        add('ceramic-tiles', {'area': [('slug', a) for a in areas], 'surface': surfaces})
        plan['ceramic-tiles']['type'] = ctype
    if vitrified:
        areas = (['vitrified-floor-tiles'] if floor else []) + (['vitrified-wall-tiles'] if wall else [])
        if floor and not heavy and not small_floor:
            areas += ['vitrified-living-room-tiles']
        if (w, h) in ((600, 600), (600, 1200)) and finish != 'polished' and floor:
            areas += ['vitrified-kitchen-tiles']
        if wall and (slab or big) and polished:
            areas += ['vitrified-bathroom-tiles']
        if heavy or small_floor:
            areas += ['vitrified-outdoor-tiles']
        if heavy:
            areas += ['vitrified-parking-tiles']
        vt = [vtype] if vtype else []
        vd = []
        if slab or max(w, h) >= 1600:
            vd.append('large-format')
        if p['thickness'] >= 15:
            vd.append('15mm-thick')
        sizes_extra = ['large'] if w * h >= 600 * 1200 else ['small'] if w * h <= 400 * 400 else []
        add('vitrified-tiles', {'area': [('slug', a) for a in areas], 'type': vt, 'design': vd,
                                'size_extra': sizes_extra})
        plan['vitrified-tiles']['type'] = vt   # this main's "type" group is GVT/PGVT/DC/FB/Nano only

    # --- Kitchen countertops (slabs sold for counter tops) --------------
    if counter:
        ctypes = ['kitchen-countertops', 'breakfast-countertops']
        if 'QUARTZ' in tok or 'quartz' in (p['collection'] or '').lower():
            ctypes.append('quartz-countertops')
        if design == 'granite':
            ctypes.append('granite-countertops')
        ctypes = [('slug', t) for t in ctypes]
        add('kitchen-countertops', {'type': ctypes})
        plan['kitchen-countertops']['type'] = ctypes
        plan['kitchen-countertops'].pop('design', None)

    # --- Other areas (commercial / hospitality) -------------------------
    if not cladding and (slab or k == 'pvt' or heavy) and floor:
        app = []
        if slab:
            app += ['lobby-tiles', 'reception-area-tiles', 'hotel-tiles', 'commercial-tiles']
        if k == 'pvt':
            app += ['commercial-tiles', 'office-tiles', 'corridor-tiles', 'school-tiles', 'hospital-tiles']
        if heavy:
            app += ['industrial-tiles', 'commercial-tiles']
        mat = ['vitrified-material'] + (['porcelain-material'] if specific_type == 'porcelain' else [])
        add('other-tile-areas', {'application': [('slug', a) for a in dict.fromkeys(app)], 'surface': surfaces,
                                 'material': [('slug', m) for m in mat]})
        plan['other-tile-areas']['type'] = [generic_type] + (['full-body-vitrified'] if vtype == 'full-body' else []) + (['porcelain'] if specific_type == 'porcelain' else [])

    # --- Stone & brick cladding -----------------------------------------
    if cladding:
        ct = ['decorative-wall-cladding', 'stone-wall-panels' if design in ('stone', 'granite') else 'brick-wall-panels' if 'BRICK' in tok else 'decorative-wall-cladding']
        add('stone-brick-cladding', {'application': [('slug', 'exterior-stone-cladding'), ('slug', 'interior-stone-cladding')],
                                     'type': [('slug', t) for t in dict.fromkeys(ct)]})
        plan['stone-brick-cladding']['type'] = [('slug', t) for t in dict.fromkeys(ct)]
        plan['stone-brick-cladding'].pop('design', None)
    return plan


def main():
    con = sqlite3.connect(DB_PATH)
    con.execute('PRAGMA foreign_keys = ON')
    tax = Taxonomy(con)

    rows = list(csv.DictReader(open(CSV_PATH, encoding='utf-8-sig')))
    images = {f[:-5] for f in os.listdir(IMG_DIR) if f.endswith('.webp')}

    # Image packs are folders named "<S.No>_<slug>" (e.g. "0001_lith-gris-30-slab");
    # each was saved as public/images/products/<slug>.webp. image_map.json maps
    # the sheet's S.No -> slug. Rows without an image are skipped.
    mapping = json.load(open(os.path.join(ROOT, 'scripts', 'data', 'image_map.json')))

    products = []
    for r in rows:
        no = r['S.No']
        if no not in mapping:
            continue
        slug = mapping[no]
        if slug not in images:
            continue
        m = re.match(r'(.*?) for (.*?)(?:\s+—\s+Somany (.*) collection)?$', r['name'].strip())
        base, apps, coll = m.group(1).strip(), m.group(2), m.group(3)
        tok = set(re.split(r'[\s\-]+', base.upper()))
        last = base.split()[-1]
        kind = infer_kind(last)
        sap = re.search(r'sap=(T\w+)', r['product_url']).group(1).upper()
        code = sap[4:7]
        size = SIZE_BY_CODE.get(code)
        apps_l = apps.lower()
        floor, wall, counter = 'floor' in apps_l, 'wall' in apps_l, 'counter' in apps_l
        coll_name = None
        if coll:
            coll_name = coll.strip()
            coll_name = coll_name if not coll_name.isupper() else coll_name.title()
            coll_name = re.sub(r'\bGvt\b', 'GVT', re.sub(r'\bPvt\b', 'PVT', re.sub(r'\bDc\b', 'DC', coll_name)))
        cladding = code in ('118', '246') or (coll_name or '').lower() in ('novaclad', 'cladstone', 'clador')
        thickness = 15.0 if (base.startswith('15 ') or '15' in tok and kind == 'hdvt' or 'stone 16' == (coll_name or '').lower()) else 9.0
        if (coll_name or '').lower() == 'stone 16':
            thickness = 16.0
        wall_ceramic = kind == 'ceramic' and wall and not floor
        p = dict(no=int(no), base=base, tokens=tok, kind=kind, sap=sap, code=code, w=size[0] if size else 0,
                 h=size[1] if size else 0, floor=floor, wall=wall, counter=counter, collection=coll_name,
                 cladding=cladding, thickness=thickness, slug=slug, url=r['product_url'])
        p['finish'] = infer_finish(tok, kind, code, wall and not floor)
        p['design'] = infer_design(tok, kind, wall_ceramic)
        p['color'] = infer_color(tok, base.upper())
        products.append(p)

    # Colour fallback: sample the tile image when the name has no colour word.
    try:
        from PIL import Image
        import colorsys
        for p in products:
            if p['color']:
                continue
            im = Image.open(os.path.join(IMG_DIR, p['slug'] + '.webp')).convert('RGB')
            W, H = im.size
            im = im.crop((W // 4, H // 4, 3 * W // 4, 3 * H // 4)).resize((32, 32))
            raw = im.tobytes()
            px = [tuple(raw[i:i + 3]) for i in range(0, len(raw), 3)]
            r_, g_, b_ = (sum(c[i] for c in px) / len(px) for i in range(3))
            hh, ll, ss = colorsys.rgb_to_hls(r_ / 255, g_ / 255, b_ / 255)
            if ll > 0.80: c = 'white'
            elif ll < 0.18: c = 'black'
            elif ss < 0.12: c = 'grey'
            else:
                deg = hh * 360
                if deg < 15 or deg >= 340: c = 'red' if ss > 0.4 else 'brown'
                elif deg < 45: c = 'beige' if ll > 0.6 else 'brown'
                elif deg < 70: c = 'cream' if ll > 0.6 else 'yellow'
                elif deg < 170: c = 'green'
                elif deg < 260: c = 'blue'
                else: c = 'pink'
            p['color'] = c
            p['color_from_image'] = True
    except ImportError:
        pass

    # ---------------------------------------------------------------- wipe
    con.execute('BEGIN')
    old = con.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    for t in ('inventory', 'product_variants', 'product_attributes', 'product_categories', 'product_images', 'reviews'):
        con.execute(f'DELETE FROM {t}')
    con.execute('DELETE FROM products')
    con.execute("DELETE FROM sqlite_sequence WHERE name IN ('products','product_images','product_variants','inventory','product_categories','reviews','product_attributes')")

    # ------------------------------------------------------- brand / collections
    brand = con.execute("SELECT id FROM brands WHERE slug IN ('somany','somany-ceramics','somany-grandeur') ORDER BY id LIMIT 1").fetchone()
    if brand:
        brand_id = brand[0]
        con.execute("UPDATE brands SET name='Somany Ceramics', slug='somany-ceramics', description=?, seo_title=?, seo_description=?, is_featured=1 WHERE id=?",
                    ('Somany Ceramics — vitrified, GVT, PVT, ceramic tiles and large-format slabs, available at Meenakshi Build World.',
                     'Somany Ceramics Tiles | Meenakshi Build World', 'Shop the full Somany Ceramics range of tiles and slabs at Meenakshi Build World.', brand_id))
    else:
        brand_id = con.execute("INSERT INTO brands (name, slug, is_featured) VALUES ('Somany Ceramics','somany-ceramics',1)").lastrowid

    con.execute('DELETE FROM collections')
    con.execute("DELETE FROM sqlite_sequence WHERE name='collections'")
    coll_ids = {}
    coll_counts = Counter(p['collection'] for p in products if p['collection'])
    by_coll_img = {}
    for p in products:
        if p['collection'] and p['collection'].lower() not in by_coll_img:
            by_coll_img[p['collection'].lower()] = f"/images/products/{p['slug']}.webp"
    canonical = {}
    for name, _ in coll_counts.most_common():
        canonical.setdefault(name.lower(), name)
    for low, name in canonical.items():
        n = sum(v for k, v in coll_counts.items() if k.lower() == low)
        cslug = slugify(name)
        coll_ids[low] = con.execute(
            'INSERT INTO collections (name, slug, tagline, banner_url, description, is_featured) VALUES (?,?,?,?,?,?)',
            (name, cslug, 'Somany Ceramics', by_coll_img[low],
             f'{name} collection by Somany Ceramics — {n} design{"s" if n != 1 else ""} available at Meenakshi Build World.',
             1 if n >= 8 else 0)).lastrowid

    # ------------------------------------------------------------- insert
    TYPE_LABEL = {'gvt': 'Glazed Vitrified Tile (GVT)', 'slab': 'Vitrified Slab', 'pvt': 'Polished Vitrified Tile (PVT)',
                  'ceramic': 'Ceramic Tile', 'italmarmi': 'Italmarmi Designer Tile', 'hdvt': 'Heavy Duty Vitrified Tile (HDVT)'}
    FIN_LABEL = {'polished': 'polished', 'high-gloss': 'high-gloss', 'glossy': 'glossy', 'matt': 'matt',
                 'carving': 'carving', 'rustic': 'rustic'}
    seen_slugs = set()
    report = []
    featured_pick = set()
    # Feature a spread: first two of each main range type.
    per_kind = Counter()
    for p in products:
        if per_kind[p['kind']] < 3 and p['color']:
            featured_pick.add(p['no']); per_kind[p['kind']] += 1
    trending_pick = set()
    trending_kinds = Counter()
    for p in reversed(products):
        if trending_kinds[p['kind']] < 2 and p['no'] not in featured_pick:
            trending_pick.add(p['no']); trending_kinds[p['kind']] += 1

    plan_counts = Counter()
    unresolved = Counter()
    for p in products:
        name = title_case(p['base'])
        slug = p['slug']
        while slug in seen_slugs:
            slug += '-' + p['sap'].lower()[-6:]
        seen_slugs.add(slug)
        sku = p['sap']
        size_txt = f"{p['w']}x{p['h']} mm" if p['w'] else None
        apps = [a for a, f in (('floors', p['floor']), ('walls', p['wall']), ('kitchen counter tops', p['counter'])) if f]
        desc = (f"{name} from Somany Ceramics — a {FIN_LABEL[p['finish']]}-finish {TYPE_LABEL[p['kind']].lower()}"
                + (f" in {size_txt}" if size_txt else '')
                + (f", part of the {canonical[p['collection'].lower()]} collection" if p['collection'] else '')
                + f". Suitable for {', '.join(apps[:-1]) + ' and ' + apps[-1] if len(apps) > 1 else apps[0]}.")
        pcs = PCS_PER_BOX.get((p['w'], p['h']), 4)
        sqm = round(p['w'] * p['h'] * pcs / 1e6, 2) if p['w'] else 1.44
        sqft = round(sqm * 10.7639, 2)
        kg_per_sqm = 20 if p['kind'] in ('ceramic', 'italmarmi') else 22 if p['thickness'] < 12 else 35
        weight = round(sqm * kg_per_sqm, 1)
        coll_id = coll_ids.get((p['collection'] or '').lower())
        pid = con.execute(
            '''INSERT INTO products (name, sku, slug, brand_id, collection_id, series, price, offer_price, dealer_price,
                 gst_percentage, stock, thickness_mm, coverage_sqft_per_box, coverage_sqmt_per_box, weight_kg_per_box,
                 pieces_per_box, warranty_years, description, is_featured, is_trending, published, rating_avg, reviews_count,
                 seo_title, seo_description, seo_keywords)
               VALUES (?,?,?,?,?,?,0,NULL,NULL,18,100,?,?,?,?,?,10,?,?,?,1,0,0,?,?,?)''',
            (name, sku, slug, brand_id, coll_id, canonical.get((p['collection'] or '').lower()),
             p['thickness'], sqft, sqm, weight, pcs, desc,
             1 if p['no'] in featured_pick else 0, 1 if p['no'] in trending_pick else 0,
             f'{name} | Somany Tiles | Meenakshi Build World',
             desc[:300],
             ', '.join(filter(None, [name, 'Somany', TYPE_LABEL[p['kind']], size_txt, p['finish'], p['design'], p['color']])))).lastrowid
        img = f'/images/products/{p["slug"]}.webp'
        con.execute('INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES (?,?,?,1,0)',
                    (pid, img, f'{name} — Somany {TYPE_LABEL[p["kind"]]}'))

        plan = plan_product(p, tax)
        cat_ids = []
        default_size_cat = None
        for main, groups in plan.items():
            cat_ids.append(tax.mains[main])
            if p['w']:
                sid = tax.ensure_size(main, p['w'], p['h'])
                cat_ids.append(sid)
                if default_size_cat is None:
                    default_size_cat = sid
            for extra in groups.get('size_extra', []):
                cid = tax.find(main, 'size', extra)
                if cid: cat_ids.append(cid)
            for g, values in groups.items():
                if g == 'size_extra':
                    continue
                for v in values:
                    if isinstance(v, tuple):
                        cid = tax.by_slug(main, v[1])
                    else:
                        cid = tax.find(main, g, v)
                    if cid:
                        cat_ids.append(cid)
                    else:
                        unresolved[(main, g, v if not isinstance(v, tuple) else v[1])] += 1
            plan_counts[main] += 1
        for cid in dict.fromkeys(cat_ids):
            con.execute('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?,?)', (pid, cid))
        vid = con.execute(
            '''INSERT INTO product_variants (product_id, sku, size_category_id, price, offer_price, dealer_price, stock,
                 thickness_mm, coverage_sqft_per_box, weight_kg_per_box, pieces_per_box, is_default, status)
               VALUES (?,?,?,0,NULL,NULL,100,?,?,?,?,1,'active')''',
            (pid, sku + '-V1', default_size_cat, p['thickness'], sqft, weight, pcs)).lastrowid
        con.execute('INSERT INTO inventory (variant_id, quantity_boxes, reserved_boxes, reorder_level, warehouse_location) VALUES (?,100,0,20,?)',
                    (vid, 'Main Warehouse'))
        report.append({'S.No': p['no'], 'name': name, 'sku': sku, 'slug': slug, 'type': p['kind'], 'size': size_txt or '',
                       'finish': p['finish'], 'design': p['design'], 'color': p['color'] or '',
                       'color_source': 'image' if p.get('color_from_image') else 'name',
                       'collection': canonical.get((p['collection'] or '').lower(), ''),
                       'applications': ', '.join(apps), 'main_categories': ' | '.join(plan.keys()), 'image': img})

    # Main category thumbnails -> a real product photo from that category.
    # Keep size lists in natural order (by tile area) wherever sizes were added.
    for main in {m for m, _, _ in tax.created}:
        sizes = con.execute('SELECT id, name, slug FROM categories WHERE parent_id = ? AND group_id = ?',
                            (tax.mains[main], tax.groups['size'])).fetchall()
        def size_key(r_):
            m_ = re.search(r'(\d+)\s*x\s*(\d+)', r_[1].lower())
            if not m_:
                return (2, 0, 0, r_[1])
            a_, b_ = int(m_.group(1)), int(m_.group(2))
            return (0, a_ * b_, a_, r_[1]) if a_ >= 50 else (-1, a_ * b_, a_, r_[1])   # imperial 1x1/2x2 first
        for i, r_ in enumerate(sorted(sizes, key=size_key), 1):
            con.execute('UPDATE categories SET display_order = ? WHERE id = ?', (i, r_[0]))

    # Smallest (most specific) categories pick first so every tile shows a different photo.
    used = set()
    mains_by_size = sorted(tax.mains.items(), key=lambda kv: plan_counts.get(kv[0], 0))
    for main, mid in mains_by_size:
        rows_ = con.execute('''SELECT pi.image_url, (SELECT COUNT(*) FROM product_categories z JOIN categories zc ON zc.id = z.category_id
                                   WHERE z.product_id = p.id AND zc.parent_id IS NULL) AS spread
                               FROM product_categories pc JOIN product_images pi ON pi.product_id = pc.product_id
                               JOIN products p ON p.id = pc.product_id WHERE pc.category_id = ?
                               ORDER BY p.is_featured DESC, spread ASC, p.id''', (mid,)).fetchall()
        pick = next((r_[0] for r_ in rows_ if r_[0] not in used), rows_[0][0] if rows_ else None)
        if pick:
            used.add(pick)
            con.execute('UPDATE categories SET image = ? WHERE id = ?', (pick, mid))

    # Sub-category tiles (mega menu / category grids) -> a real product from that
    # sub-category, varied within each parent. Only placeholder (stock-photo or
    # empty) images are replaced, so anything uploaded via the admin is kept.
    for main, mid in tax.mains.items():
        used_here = set()
        kids = con.execute('''SELECT id, image FROM categories WHERE parent_id = ? ORDER BY display_order, id''', (mid,)).fetchall()
        for cid, cur_img in kids:
            if cur_img and not ('unsplash.com' in cur_img or cur_img.startswith('/images/products/')):
                continue
            imgs = [r_[0] for r_ in con.execute('''SELECT pi.image_url FROM product_categories pc
                        JOIN product_images pi ON pi.product_id = pc.product_id JOIN products p ON p.id = pc.product_id
                        WHERE pc.category_id = ? ORDER BY p.is_featured DESC, p.id LIMIT 60''', (cid,))]
            if not imgs:
                continue
            pick = next((u for u in imgs if u not in used_here), imgs[0])
            used_here.add(pick)
            con.execute('UPDATE categories SET image = ? WHERE id = ?', (pick, cid))
    con.commit()

    with open(REPORT_PATH, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(report[0].keys()))
        w.writeheader(); w.writerows(report)

    print(f'Removed {old} dummy products; imported {len(products)} Somany products.')
    print('Products per main category:', dict(plan_counts))
    print('New size categories:', tax.created)
    print('Collections:', len(coll_ids))
    if unresolved:
        print('Tags with no matching category (skipped):')
        for k, v in unresolved.most_common():
            print('  ', k, v)


if __name__ == '__main__':
    main()

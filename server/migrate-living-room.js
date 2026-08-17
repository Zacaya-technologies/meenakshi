// Meenakshi Build World — Living Room Tiles complete taxonomy ecosystem.
// Idempotent, additive migration:
//   1. Adds a nullable `parent_main_id` column so room MAIN categories
//      (Bedroom / Hallway / Pooja Room / Drawing Room / Dining Room) link to
//      the Living Room Tiles main for the BY AREA mega-menu column.
//   2. Moves Living Room Floor/Wall Tiles into the "By Area" group.
//   3. Fills every facet missing from the Living Room spec: finish Anti Skid;
//      sizes 2x2 / 2x4 / 800x800 / 800x2400 / 800x3000; designs Carpet,
//      Granite, Texture, Brick, Moroccan, Athangudi, Fluted, Terrazzo,
//      Book Match, End Match, Statuario, White Brick + room combos
//      3D Pooja Room / 3D Bedroom / Wooden Bedroom; types Glass Highlighter,
//      Printed, Designer, Glazed Vitrified, Double Charge Vitrified; colors
//      White Bedroom / Blue Bedroom.
//   4. Creates the 5 room MAIN categories (each with full Area/Size/Design/
//      Type/Finish/Color facets + room-specific combos) right after Living
//      Room Tiles in nav order.
// Nothing is deleted; existing products and category tags are untouched.
const db = require('./db');

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/&/g, ' and ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function slugifySize(value) {
    return slugify(value.replace(/\s*mm\b/gi, '').trim());
}

const TILE_IMAGES = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1000&q=80'
];

// Shared facet value sets (bare display names, matching the existing
// living-room-tiles convention — composed "X <Room> Tiles" text is for SEO).
const SIZES = ['2x2', '2x4', '800x800 mm', '800x1600 mm', '1200x1800 mm', '800x2400 mm', '800x3000 mm'];
const FINISHES = ['Anti Skid', 'Glossy', 'Matt', 'Rustic', 'Polished'];
const DESIGNS = [
    '3D', 'Wooden', 'Marble', 'Carpet', 'Granite', 'Mosaic', 'Texture', 'Stone', 'Brick',
    'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario', 'White Brick'
];
const TYPES = [
    'Ceramic', 'Vitrified', 'Glass Highlighter', 'Printed', 'Designer', 'Digital', 'Porcelain',
    'Glazed Vitrified', 'Double Charge Vitrified', 'Full Body Vitrified'
];
const COLORS = [
    'White', 'Black', 'Grey', 'Brown', 'Beige', 'Ivory', 'Cream', 'Yellow', 'Blue', 'Green',
    'Pink', 'Orange', 'Purple', 'Black & White', 'Grey & White'
];

// Room mains linked to Living Room Tiles (parent_main_id). Each room gets its
// own Area children + the shared facet sets + room-specific design/color combos.
const ROOMS = [
    { slug: 'bedroom-tiles', name: 'Bedroom Tiles', area: ['Bedroom Floor Tiles', 'Bedroom Wall Tiles'], designs: ['3D Bedroom', 'Wooden Bedroom'], colors: ['White Bedroom', 'Blue Bedroom'] },
    { slug: 'hallway-tiles', name: 'Hallway Tiles', area: ['Hallway Floor Tiles', 'Hallway Wall Tiles'], designs: [], colors: [] },
    { slug: 'pooja-room-tiles', name: 'Pooja Room Tiles', area: ['Pooja Room Floor Tiles', 'Pooja Room Wall Tiles'], designs: ['3D Pooja Room'], colors: [] },
    { slug: 'drawing-room-tiles', name: 'Drawing Room Tiles', area: ['Drawing Room Floor Tiles'], designs: [], colors: [] },
    { slug: 'dining-room-tiles', name: 'Dining Room Tiles', area: ['Dining Room Floor Tiles', 'Dining Room Wall Tiles'], designs: [], colors: [] }
];

async function ensureParentMainColumn() {
    const isSqlite = db.getMode() === 'sqlite';
    if (isSqlite) {
        const cols = await db.query(`PRAGMA table_info(categories)`);
        if (cols.some(c => c.name === 'parent_main_id')) {
            console.log('[Migration] parent_main_id column already exists');
            return;
        }
        await db.query(`ALTER TABLE categories ADD COLUMN parent_main_id INTEGER`);
        console.log('[Migration] Added parent_main_id column to categories');
    } else {
        try {
            await db.query(`ALTER TABLE categories ADD COLUMN parent_main_id INT`);
            console.log('[Migration] Added parent_main_id column to categories');
        } catch (e) {
            console.log('[Migration] parent_main_id column already exists');
        }
    }
}

async function run() {
    await ensureParentMainColumn();

    const mainIdBySlug = {};
    for (const row of await db.query(`SELECT id, slug FROM categories WHERE parent_id IS NULL`)) mainIdBySlug[row.slug] = row.id;
    const groupIdByKey = {};
    for (const row of await db.query(`SELECT id, group_key FROM category_groups`)) groupIdByKey[row.group_key] = row.id;

    async function exists(parentId, groupId, name) {
        return !!(await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND group_id = ? AND name = ?`, [parentId, groupId, name]));
    }
    async function siblingSlugExists(parentId, slug) {
        return !!(await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [parentId, slug]));
    }
    async function mainSlugExists(slug) {
        return !!(await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [slug]));
    }
    async function uniqueSlug(parentId, groupKey, base) {
        let slug = base;
        if (await siblingSlugExists(parentId, slug)) slug = groupKey ? `${slug}-${groupKey}` : `${slug}-2`;
        let n = 2;
        while (await siblingSlugExists(parentId, slug)) slug = `${base}-${n++}`;
        return slug;
    }
    async function insert(parentId, groupKey, displayName, composedName, order) {
        const groupId = groupIdByKey[groupKey];
        const baseSlug = groupKey === 'size' ? slugifySize(displayName) : slugify(displayName);
        const slug = await uniqueSlug(parentId, groupKey, baseSlug);
        await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, icon, seo_title, seo_description, status, display_order)
            VALUES (?, ?, ?, ?, 'tile', ?, ?, 'grid', ?, ?, 'active', ?)
        `, [
            displayName, slug, parentId, groupId,
            `${composedName} — premium quality, competitively priced, ready for fast delivery.`,
            TILE_IMAGES[order % TILE_IMAGES.length],
            `${composedName} | Meenakshi Build World`,
            `Shop ${composedName.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`,
            order
        ]);
        return slug;
    }

    const lrId = mainIdBySlug['living-room-tiles'];
    if (!lrId) throw new Error('living-room-tiles main category not found');

    // ---- 1. Move Living Room Floor/Wall Tiles into the By Area group -------
    const areaGroupId = groupIdByKey['area'];
    const moves = await db.query(`SELECT id, name FROM categories WHERE parent_id = ? AND name IN ('Living Room Floor Tiles', 'Living Room Wall Tiles')`, [lrId]);
    for (const c of moves) {
        if (c && c.id && c.name) {
            await db.query(`UPDATE categories SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [areaGroupId, c.id]);
            console.log(`[Migration] Moved "${c.name}" to By Area group`);
        }
    }

    // ---- 2. Fill missing Living Room Tiles facet values --------------------
    let lrOrder = (await db.queryOne(`SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM categories WHERE parent_id = ?`, [lrId])).maxOrder;
    lrOrder = parseInt(lrOrder) + 1;
    const addFacets = async (groupKey, values, composer) => {
        for (const v of values) {
            if (await exists(lrId, groupIdByKey[groupKey], v)) { continue; }
            const slug = await insert(lrId, groupKey, v, composer(v), lrOrder++);
            console.log(`[Migration] living-room +${groupKey} "${v}" (slug=${slug})`);
        }
    };
    await addFacets('finish', ['Anti Skid'], v => `${v} Living Room Tiles`);
    await addFacets('size', ['2x2', '2x4', '800x800 mm', '800x2400 mm', '800x3000 mm'], v => `${v} Living Room Tiles`);
    await addFacets('design', ['Carpet', 'Granite', 'Texture', 'Brick', 'Moroccan', 'Athangudi', 'Fluted', 'Terrazzo', 'Book Match', 'End Match', 'Statuario', 'White Brick', '3D Pooja Room', '3D Bedroom', 'Wooden Bedroom'], v => `${v} Living Room Tiles`);
    await addFacets('type', ['Glass Highlighter', 'Printed', 'Designer', 'Glazed Vitrified', 'Double Charge Vitrified'], v => `${v} Living Room Tiles`);
    await addFacets('color', ['White Bedroom', 'Blue Bedroom'], v => `${v} Living Room Tiles`);

    // ---- 3. Create the 5 room MAIN categories right after Living Room ------
    // Shift mains at/after position 7 out of the way exactly once (guarded by
    // the room-main existence check below, so re-runs never double-shift).
    const needShift = (await db.queryOne(`SELECT COUNT(*) as c FROM categories WHERE parent_id IS NULL AND slug = 'bedroom-tiles'`)).c === 0;
    if (needShift) {
        await db.query(`UPDATE categories SET display_order = display_order + 5, updated_at = CURRENT_TIMESTAMP WHERE parent_id IS NULL AND display_order >= 7`);
        console.log('[Migration] Shifted existing mains to make room for room categories');
    }

    let roomOrder = 7;
    for (const room of ROOMS) {
        let roomMain = await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [room.slug]);
        if (!roomMain) {
            const res = await db.query(`
                INSERT INTO categories (name, slug, parent_id, group_id, category_type, description, image, banner_url, icon, seo_title, seo_description, status, display_order, featured, parent_main_id)
                VALUES (?, ?, NULL, NULL, 'tile', ?, ?, ?, 'layout', ?, ?, 'active', ?, 1, ?)
            `, [
                room.name, room.slug,
                `Premium ${room.name.toLowerCase()} — floor and wall tiles curated for every room. Full-size range, every finish, transparent pricing.`,
                TILE_IMAGES[roomOrder % TILE_IMAGES.length], TILE_IMAGES[roomOrder % TILE_IMAGES.length],
                `${room.name} | Meenakshi Build World`,
                `Shop ${room.name.toLowerCase()} online. Compare designs, sizes and prices at Meenakshi Build World.`,
                roomOrder, lrId
            ]);
            roomMain = { id: res.insertId };
            console.log(`[Migration] Created room main "${room.name}" (id=${roomMain.id}, parent_main_id=${lrId})`);
        } else {
            await db.query(`UPDATE categories SET parent_main_id = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [lrId, roomOrder, roomMain.id]);
            console.log(`[Migration] Room main "${room.name}" already exists (id=${roomMain.id}) — linked to Living Room`);
        }
        const roomId = roomMain.id;
        roomOrder++;

        // Room Area children
        let order = 1;
        for (const areaName of room.area) {
            if (await exists(roomId, areaGroupId, areaName)) { continue; }
            const slug = await insert(roomId, 'area', areaName, areaName, order);
            console.log(`[Migration]   ${room.slug} +area "${areaName}" (slug=${slug})`);
            order++;
        }

        // Shared facet sets + room-specific combos
        const addRoomFacets = async (groupKey, values, composer) => {
            for (const v of values) {
                if (await exists(roomId, groupIdByKey[groupKey], v)) { continue; }
                const slug = await insert(roomId, groupKey, v, composer(v), order++);
                console.log(`[Migration]   ${room.slug} +${groupKey} "${v}" (slug=${slug})`);
            }
        };
        await addRoomFacets('size', SIZES, v => `${v} ${room.name}`);
        await addRoomFacets('design', [...DESIGNS, ...room.designs], v => `${v} ${room.name}`);
        await addRoomFacets('type', TYPES, v => `${v} ${room.name}`);
        await addRoomFacets('finish', FINISHES, v => `${v} ${room.name}`);
        await addRoomFacets('color', [...COLORS, ...room.colors], v => `${v} ${room.name}`);
    }

    console.log('[Migration] Living Room Tiles ecosystem complete.');
    process.exit(0);
}

run().catch(err => { console.error('[Migration] Failed:', err); process.exit(1); });

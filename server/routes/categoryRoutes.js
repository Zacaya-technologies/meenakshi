const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function slugify(text) {
    return text.toString().toLowerCase().trim()
        .replace(/&/g, ' and ')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Ensures a slug is unique among siblings (same parent_id) — nested facet
// categories like /floor-tiles/marble and /wall-tiles/marble are both valid
// because uniqueness is scoped per parent, not global.
async function uniqueSlug(baseSlug, parentId, groupKey, excludeId) {
    let slug = baseSlug;
    const exists = async s => {
        const row = parentId === null || parentId === undefined
            ? await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [s])
            : await db.queryOne(`SELECT id FROM categories WHERE parent_id = ? AND slug = ?`, [parentId, s]);
        if (row && excludeId && String(row.id) === String(excludeId)) return null;
        return row;
    };
    if (await exists(slug)) slug = groupKey ? `${slug}-${groupKey}` : `${slug}-2`;
    let n = 2;
    while (await exists(slug)) { slug = `${baseSlug}-${n++}`; }
    return slug;
}

async function getGroupKey(groupId) {
    if (!groupId) return null;
    const g = await db.queryOne(`SELECT group_key FROM category_groups WHERE id = ?`, [groupId]);
    return g ? g.group_key : null;
}

async function breadcrumbFor(category) {
    const crumbs = [{ name: 'Home', url: '/' }];
    if (!category) return crumbs;
    if (category.parent_id) {
        const parent = await db.queryOne(`SELECT name, slug FROM categories WHERE id = ?`, [category.parent_id]);
        if (parent) {
            crumbs.push({ name: parent.name, url: `/${parent.slug}` });
            crumbs.push({ name: category.name, url: `/${parent.slug}/${category.slug}` });
            return crumbs;
        }
    }
    crumbs.push({ name: category.name, url: `/${category.slug}` });
    return crumbs;
}

// GET /api/v1/categories - flat list with optional filters
// ?parent_id=<id|null>  ?group_id=<id>  ?status=active
router.get('/', async (req, res) => {
    try {
        const { parent_id, group_id, status } = req.query;
        const conditions = [];
        const params = [];

        if (parent_id === 'null' || parent_id === '') {
            conditions.push('c.parent_id IS NULL');
        } else if (parent_id) {
            conditions.push('c.parent_id = ?');
            params.push(parent_id);
        }
        if (group_id) { conditions.push('c.group_id = ?'); params.push(group_id); }
        if (status) { conditions.push('c.status = ?'); params.push(status); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const categories = await db.query(`
            SELECT c.*, p.name as parent_name, p.slug as parent_slug, g.group_key, g.name as group_name
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            LEFT JOIN category_groups g ON c.group_id = g.id
            ${where}
            ORDER BY c.display_order ASC, c.name ASC
        `, params);

        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/categories/tree - full nested structure for the admin category
// manager: main categories -> groups -> child categories, with live product counts.
router.get('/tree', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const mains = await db.query(`SELECT * FROM categories WHERE parent_id IS NULL ORDER BY display_order ASC, name ASC`);
        const groups = await db.query(`SELECT * FROM category_groups ORDER BY display_order ASC`);
        const children = await db.query(`
            SELECT c.*, (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id) as product_count
            FROM categories c WHERE c.parent_id IS NOT NULL ORDER BY c.display_order ASC, c.name ASC
        `);

        const tree = mains.map(main => ({
            ...main,
            rooms: mains.filter(r => r.parent_main_id === main.id),
            groups: groups.map(g => ({
                ...g,
                children: children.filter(c => c.parent_id === main.id && c.group_id === g.id)
            }))
        }));

        res.json({ success: true, tree });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/categories/resolve?path=a/b/c — resolves an arbitrary-depth slug
// path used by the /tiles/[...slug] catch-all template (e.g.
// /tiles/living-room-tiles/bedroom-tiles/bedroom-floor-tiles). The first segment
// is a main category; each following segment may be a child facet OR its own
// main category (rooms link down into their floor/wall children). Breadcrumb
// URLs use the canonical /tiles/... scheme. Fully database-driven — a category
// created in the admin panel is reachable here immediately.
router.get('/resolve', async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).json({ success: false, message: 'path query param is required' });
        const segs = String(path).split('/').filter(Boolean);
        if (!segs.length || segs.length > 6) return res.status(400).json({ success: false, message: 'Invalid category path' });

        // All child categories of a "scope" category, plus any main category
        // that shares its slug (so /tiles/living-room-tiles/bedroom-tiles/
        // bedroom-floor-tiles resolves through the main Bedroom Tiles node).
        const scopeIds = async (cat) => {
            const ids = [cat.id];
            if (cat.parent_id) {
                const twin = await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [cat.slug]);
                if (twin) ids.push(twin.id);
            }
            return ids;
        };

        let parent = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [segs[0]]);
        if (!parent) return res.status(404).json({ success: false, message: 'Category not found' });

        const crumbs = [
            { name: 'Home', url: '/' },
            { name: 'Tiles', url: '/tiles' },
            { name: parent.name, url: `/tiles/${parent.slug}` }
        ];
        let current = parent;
        let crumbMainSlug = parent.slug;
        let target = null;
        let group = null;

        for (let i = 1; i < segs.length; i++) {
            const scopes = await scopeIds(current);
            const child = await db.queryOne(`
                SELECT c.*, g.group_key, g.name as group_name
                FROM categories c LEFT JOIN category_groups g ON c.group_id = g.id
                WHERE c.parent_id IN (${scopes.map(() => '?').join(',')}) AND c.slug = ?
            `, [...scopes, segs[i]]);
            if (child) {
                crumbs.push({ name: child.name, url: `/tiles/${crumbMainSlug}/${child.slug}` });
                if (i === segs.length - 1) {
                    target = child;
                    group = { key: child.group_key, name: child.group_name };
                    const ownerMain = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND id = ?`, [child.parent_id]);
                    if (ownerMain) parent = ownerMain;
                    break;
                }
                current = child;
                // If this child doubles as a main category, deeper crumbs are
                // canonical under that main (e.g. /tiles/bedroom-tiles/...).
                const twin = await db.queryOne(`SELECT slug FROM categories WHERE parent_id IS NULL AND slug = ?`, [child.slug]);
                if (twin) crumbMainSlug = twin.slug;
                continue;
            }
            // Room mains linked to the current main via parent_main_id (e.g.
            // Bedroom Tiles under Living Room Tiles) are walkable as if they
            // were children, deep-linking /tiles/living-room-tiles/bedroom-tiles.
            const linkScope = current.parent_id
                ? (await db.queryOne(`SELECT id FROM categories WHERE parent_id IS NULL AND slug = ?`, [current.slug])) || current
                : current;
            const linked = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND parent_main_id = ? AND slug = ?`, [linkScope.id, segs[i]]);
            if (linked) {
                crumbs.push({ name: linked.name, url: `/tiles/${linked.slug}` });
                current = linked;
                parent = linked;
                crumbMainSlug = linked.slug;
                continue;
            }
            const main = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [segs[i]]);
            if (main) {
                crumbs.push({ name: main.name, url: `/tiles/${main.slug}` });
                current = main;
                parent = main;
                crumbMainSlug = main.slug;
                continue;
            }
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (!target) {
            return res.json({ success: true, kind: 'main', category: parent, breadcrumb: crumbs });
        }
        res.json({
            success: true,
            kind: 'facet',
            category: target,
            parent,
            group,
            breadcrumb: crumbs
        });
    } catch (err) {
        console.error('Resolve Category Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/categories/:parentSlug - resolve a main category by slug
router.get('/:parentSlug', async (req, res) => {
    try {
        const category = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [req.params.parentSlug]);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        const breadcrumb = await breadcrumbFor(category);
        res.json({ success: true, category, breadcrumb });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/v1/categories/:parentSlug/:childSlug - resolve a nested facet page
// (e.g. /floor-tiles/marble) with SEO fields + breadcrumb, for generateMetadata.
router.get('/:parentSlug/:childSlug', async (req, res) => {
    try {
        const parent = await db.queryOne(`SELECT * FROM categories WHERE parent_id IS NULL AND slug = ?`, [req.params.parentSlug]);
        if (!parent) return res.status(404).json({ success: false, message: 'Category not found' });

        const child = await db.queryOne(`
            SELECT c.*, g.group_key, g.name as group_name
            FROM categories c LEFT JOIN category_groups g ON c.group_id = g.id
            WHERE c.parent_id = ? AND c.slug = ?
        `, [parent.id, req.params.childSlug]);
        if (!child) return res.status(404).json({ success: false, message: 'Category not found' });

        const breadcrumb = await breadcrumbFor(child);
        res.json({ success: true, category: child, parent, group: { key: child.group_key, name: child.group_name }, breadcrumb });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/v1/categories - admin: add category / subcategory
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            name, parent_id, group_id, description, image, banner_url, icon,
            seo_title, seo_description, status, display_order, slug: slugOverride, parent_main_id
        } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

        const parentId = parent_id || null;
        const groupKey = await getGroupKey(group_id);
        // A custom slug (admin-provided) is honoured verbatim where it is unique
        // among siblings; otherwise it falls back to the auto-generated slug.
        const baseSlug = slugOverride && slugify(slugOverride).length ? slugify(slugOverride) : slugify(name);
        const slug = await uniqueSlug(baseSlug, parentId, groupKey, null);

        const isSqlite = db.getMode() === 'sqlite';
        const resDb = await db.query(`
            INSERT INTO categories (name, slug, parent_id, group_id, description, image, banner_url, icon, seo_title, seo_description, status, display_order, parent_main_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, slug, parentId, group_id || null, description || '', image || '', banner_url || '', icon || 'grid',
            seo_title || `${name} | Meenakshi Build World`, seo_description || description || '',
            status || 'active', display_order || 0, parent_main_id || null
        ]);
        const id = isSqlite ? resDb.insertId : (await db.queryOne(`SELECT id FROM categories WHERE slug = ? AND (parent_id = ? OR (? IS NULL AND parent_id IS NULL))`, [slug, parentId, parentId])).id;

        res.json({
            success: true,
            message: `Category '${name}' created.`,
            id,
            slug,
            url: parentId ? undefined : `/${slug}`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/v1/categories/:id - admin: edit / move / re-parent / change group
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const existing = await db.queryOne(`SELECT * FROM categories WHERE id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });

        const {
            name, parent_id, group_id, description, image, banner_url, icon,
            seo_title, seo_description, status, display_order, slug: slugOverride, parent_main_id
        } = req.body;

        const parentId = parent_id !== undefined ? (parent_id || null) : existing.parent_id;
        const nameChanged = name && name !== existing.name;
        const parentChanged = parent_id !== undefined && parentId !== existing.parent_id;
        // An explicit slug override always wins; otherwise re-derive only when
        // the name or parent changed.
        let slug = existing.slug;
        if (slugOverride && slugify(slugOverride).length && slugify(slugOverride) !== slug) {
            const groupKey = await getGroupKey(group_id !== undefined ? group_id : existing.group_id);
            slug = await uniqueSlug(slugify(slugOverride), parentId, groupKey, existing.id);
        } else if (nameChanged || parentChanged) {
            const groupKey = await getGroupKey(group_id !== undefined ? group_id : existing.group_id);
            slug = await uniqueSlug(slugify(name || existing.name), parentId, groupKey, existing.id);
        }

        await db.query(`
            UPDATE categories SET
                name = COALESCE(?, name),
                slug = ?,
                parent_id = ?,
                group_id = COALESCE(?, group_id),
                description = COALESCE(?, description),
                image = COALESCE(?, image),
                banner_url = COALESCE(?, banner_url),
                icon = COALESCE(?, icon),
                seo_title = COALESCE(?, seo_title),
                seo_description = COALESCE(?, seo_description),
                status = COALESCE(?, status),
                display_order = COALESCE(?, display_order),
                parent_main_id = COALESCE(?, parent_main_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, slug, parentId, group_id, description, image, banner_url, icon, seo_title, seo_description, status, display_order, parent_main_id, req.params.id]);

        res.json({ success: true, message: 'Category updated', slug });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/categories/:id - admin (cascades to subcategories + product tags)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const childCount = await db.queryOne(`SELECT COUNT(*) as c FROM categories WHERE parent_id = ?`, [req.params.id]);
        await db.query(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
        res.json({ success: true, message: 'Category deleted', subcategoriesRemoved: childCount ? parseInt(childCount.c) : 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

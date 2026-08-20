const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tile_marketplace.sqlite');
db.all(`SELECT c.id, c.name, c.slug, c.parent_id, c.group_id, c.parent_main_id, c.display_order, c.status,
        g.name as group_name, g.group_key,
        p.name as parent_name
        FROM categories c
        LEFT JOIN category_groups g ON c.group_id = g.id
        LEFT JOIN categories p ON c.parent_id = p.id
        ORDER BY c.parent_id IS NULL DESC, c.parent_id, c.display_order, c.name`, (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(JSON.stringify(rows, null, 1));
  db.close();
});

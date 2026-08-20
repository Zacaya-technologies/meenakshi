const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tile_marketplace.sqlite');

function all(sql, params=[]){ return new Promise((res,rej)=>db.all(sql,params,(e,r)=>e?rej(e):res(r))); }
function one(sql, params=[]){ return new Promise((res,rej)=>db.get(sql,params,(e,r)=>e?rej(e):res(r))); }

(async () => {
  const mains = await all(`SELECT id, name, slug, display_order FROM categories WHERE parent_id IS NULL ORDER BY display_order, name`);
  console.log('===== MAIN CATEGORIES =====');
  for (const m of mains) {
    const kids = await all(`SELECT g.group_key, COUNT(*) as n FROM categories c LEFT JOIN category_groups g ON c.group_id=g.id WHERE c.parent_id=? GROUP BY g.group_key`, [m.id]);
    console.log(`${m.id}\t${m.name}\t/${m.slug}\t` + kids.map(k=>`${k.group_key}:${k.n}`).join(' '));
  }
})().catch(e=>{console.error(e);process.exit(1);}).finally(()=>db.close());

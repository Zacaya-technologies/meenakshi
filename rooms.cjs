const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tile_marketplace.sqlite');
function all(sql, params=[]){ return new Promise((res,rej)=>db.all(sql,params,(e,r)=>e?rej(e):res(r))); }
(async () => {
  const rooms = [435,907,968,1025,1083,1139];
  for (const rid of rooms) {
    const m = await all(`SELECT name,slug FROM categories WHERE id=?`,[rid]);
    const kids = await all(`SELECT c.id,c.name,c.slug,g.group_key FROM categories c LEFT JOIN category_groups g ON c.group_id=g.id WHERE c.parent_id=? AND c.status='active' ORDER BY c.display_order,c.name`,[rid]);
    console.log(`\n# ${m[0].name} (${m[0].slug}):`);
    for (const k of kids) console.log(`   [${k.group_key}] ${k.slug} -> ${k.name}`);
  }
})().catch(e=>{console.error(e);process.exit(1);}).finally(()=>db.close());

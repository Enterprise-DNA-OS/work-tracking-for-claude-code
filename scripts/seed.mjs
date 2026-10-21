import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db) { await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8')); }
if(process.argv[1] && path.resolve(process.argv[1])===path.join(REPO_ROOT,'scripts/seed.mjs')) {
 const db=await getDb(); try { await seed(db); console.log('Demo seeded (idempotent).'); } finally {await db.close();}
}

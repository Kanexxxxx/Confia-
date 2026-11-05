import {pessoa,mesmaOrigem,corpo,texto,falha,json} from '@/lib/confia/acesso';
import {grava,lista} from '@/lib/confia/banco';
export async function GET(){try{const u=await pessoa();const rows=await lista<{name:string}>('SELECT name FROM confia_profiles WHERE user_id=?',u.userId);return json({nome:rows[0]?.name??u.displayName,email:u.email});}catch(e){return falha(e);}}
export async function POST(req:Request){try{mesmaOrigem(req);const u=await pessoa();const b=await corpo(req);const nome=texto(b.nome,2,80,'Nome');const now=Date.now();await grava('INSERT INTO confia_profiles (user_id,name,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,updated_at=excluded.updated_at',u.userId,nome,now,now);return json({nome});}catch(e){return falha(e);}}

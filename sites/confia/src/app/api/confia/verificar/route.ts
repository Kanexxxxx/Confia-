import { pessoa,mesmaOrigem,corpo,texto,falha,json,FalhaHttp } from '@/lib/confia/acesso';
import { analisa } from '@/lib/confia/analise';
import { lista,grava } from '@/lib/confia/banco';
export async function POST(req:Request) { try {
  mesmaOrigem(req);const user=await pessoa(); const body=await corpo(req);
  const rows=await lista<{total:number}>('SELECT COUNT(*) AS total FROM confia_analyses WHERE user_id=? AND created_at>?',user.userId,Date.now()-86400000);
  if(rows[0]?.total>=20) throw new FalhaHttp(429,'Você atingiu as 20 análises preliminares por dia.');
  let result;try { result=await analisa(texto(body.alvo,3,2048,'Endereço'),process.env.SAFEBROWSING_API_KEY); }catch(e){throw new FalhaHttp(400,e instanceof Error?e.message:'Endereço inválido.');}
  const id=crypto.randomUUID();await grava('INSERT INTO confia_analyses (id,user_id,target,hostname,verdict,result_json,created_at) VALUES (?,?,?,?,?,?,?)',id,user.userId,result.alvo,result.dominio,result.parecer,JSON.stringify(result),Date.now());
  return json({id,...result},201);
 }catch(e){return falha(e);} }
export async function GET(){try{const u=await pessoa();return json(await lista('SELECT id,target,hostname,verdict,result_json,created_at FROM confia_analyses WHERE user_id=? ORDER BY created_at DESC LIMIT 50',u.userId));}catch(e){return falha(e);}}

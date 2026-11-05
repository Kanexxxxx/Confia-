import 'server-only';
import { getChatGPTUser } from './identidade';
export class FalhaHttp extends Error { constructor(public status: number, message:string) { super(message); } }
export async function pessoa() {
  const user = await getChatGPTUser();
  if (!user) throw new FalhaHttp(401,'Entre na sua conta para continuar.');
  return user;
}
export function ehDono(email: string): boolean {
  const owner=process.env.CONFIA_OWNER_EMAIL;
  return Boolean(owner && email.toLowerCase() === owner.toLowerCase());
}
export async function dono() {
  const user=await pessoa();
  if (!ehDono(user.email)) throw new FalhaHttp(403,'Acesso restrito à administração.');
  return user;
}
export function mesmaOrigem(req:Request) {
  const origin=req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin) throw new FalhaHttp(403,'Origem não autorizada.');
}
export async function corpo(req:Request) {
  if (!(req.headers.get('content-type')??'').includes('application/json')) throw new FalhaHttp(415,'Envie JSON.');
  const raw=await req.text();
  if (raw.length>16000) throw new FalhaHttp(413,'Conteúdo muito grande.');
  try { return JSON.parse(raw) as Record<string,unknown>; } catch { throw new FalhaHttp(400,'Conteúdo inválido.'); }
}
export function texto(value:unknown,min:number,max:number,label:string) {
  if(typeof value!=='string' || value.trim().length<min || value.trim().length>max) throw new FalhaHttp(400,`${label}: use entre ${min} e ${max} caracteres.`);
  return value.trim();
}
export function falha(error:unknown) {
  const status=error instanceof FalhaHttp?error.status:503;
  const message=error instanceof FalhaHttp?error.message:'O serviço está temporariamente indisponível. Tente novamente.';
  return Response.json({erro:message},{status,headers:{'Cache-Control':'no-store'}});
}
export function json(value:unknown,status=200) { return Response.json(value,{status,headers:{'Cache-Control':'no-store'}}); }

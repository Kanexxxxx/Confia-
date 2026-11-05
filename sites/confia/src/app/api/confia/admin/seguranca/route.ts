import { dono,mesmaOrigem,corpo,texto,falha,json,FalhaHttp } from '@/lib/confia/acesso';
import { totp } from '@/lib/confia/admin';
import { lista,grava } from '@/lib/confia/banco';
import QRCode from 'qrcode';
export async function GET(){try{const u=await dono();const rows=await lista('SELECT user_id FROM confia_admin_settings WHERE user_id=?',u.userId);if(rows.length)return json({ativo:true});const otp=totp(u.email);return json({ativo:false,qr:await QRCode.toDataURL(otp.toString()),segredo:otp.secret.base32});}catch(e){return falha(e);}}
export async function POST(req:Request){try{mesmaOrigem(req);const u=await dono();const b=await corpo(req);const code=texto(b.codigo,6,6,'Código');if(totp(u.email).validate({token:code,window:1})===null)throw new FalhaHttp(400,'Código inválido. Confira o relógio do celular.');await grava('INSERT INTO confia_admin_settings (user_id,enabled_at) VALUES (?,?) ON CONFLICT(user_id) DO NOTHING',u.userId,Date.now());return json({ativo:true});}catch(e){return falha(e);}}

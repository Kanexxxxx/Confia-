import 'server-only';
import * as OTPAuth from 'otpauth';
import { dono,FalhaHttp } from './acesso';
import { lista } from './banco';
export function totp(email:string) {
  const secret=process.env.CONFIA_ADMIN_TOTP_SECRET;
  if(!secret) throw new FalhaHttp(503,'O segundo fator do administrador ainda não foi configurado.');
  return new OTPAuth.TOTP({issuer:'Confia',label:email,algorithm:'SHA1',digits:6,period:30,secret:OTPAuth.Secret.fromBase32(secret)});
}
export async function administrador(req:Request) {
  const user=await dono();
  const rows=await lista('SELECT user_id FROM confia_admin_settings WHERE user_id=?',user.userId);
  if(!rows.length) throw new FalhaHttp(403,'Ative o segundo fator antes de abrir a administração.');
  const code=req.headers.get('x-confia-otp')??'';
  if(!/^\d{6}$/.test(code)||totp(user.email).validate({token:code,window:1})===null) throw new FalhaHttp(403,'Informe o código atual do autenticador.');
  return user;
}

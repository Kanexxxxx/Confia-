export async function assinaturaValida(raw:string,signature:string|null,secret:string):Promise<boolean>{
 if(!signature||!/^sha256=[a-f0-9]{64}$/i.test(signature))return false;
 const bytes=Uint8Array.from(signature.slice(7).match(/../g)!,x=>parseInt(x,16));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(raw));
}

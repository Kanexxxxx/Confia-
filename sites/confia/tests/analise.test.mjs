import test from 'node:test';
import assert from 'node:assert/strict';
import { endereco,analisa } from '../src/lib/confia/analise.ts';
import { assinaturaValida } from '../src/lib/confia/assinatura-meta.ts';
test('recusa esquemas perigosos, senhas e destinos locais',()=>{
 for(const x of ['javascript:alert(1)','file:///etc/passwd','https://user:senha@example.com','http://127.0.0.1','http://0x7f000001','http://[::1]','http://localhost','https://intranet.local','https://example.com:8443']) assert.throws(()=>endereco(x),x);
});
test('normaliza domínio e remove tokens de URL',()=>{assert.equal(endereco('https://Example.com/compra?token=segredo#pessoal').href,'https://example.com/compra');});
test('sem fonte externa a ausência de sinais nunca vira seguro',async()=>{const r=await analisa('example.com');assert.equal(r.parecer,'inconclusivo');assert.equal(r.consultas[1].estado,'não configurado');});
test('sinais lexicais não viram acusação de fraude',async()=>{const r=await analisa('http://bit.ly/teste');assert.equal(r.parecer,'atencao');assert.ok(r.sinais.some(x=>x.titulo==='Link encurtado'));});
test('alerta externo é reportado sem abrir o destino',async()=>{const old=globalThis.fetch;let called='';globalThis.fetch=async(url)=>{called=String(url);return Response.json({matches:[{threatType:'SOCIAL_ENGINEERING'}]});};try{const r=await analisa('https://example.com','chave-de-teste');assert.equal(r.parecer,'alerta_confirmado');assert.ok(called.startsWith('https://safebrowsing.googleapis.com/'));}finally{globalThis.fetch=old;}});
test('falha externa não transforma endereço em seguro',async()=>{const old=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('offline');};try{const r=await analisa('example.com','chave-de-teste');assert.equal(r.parecer,'inconclusivo');assert.equal(r.consultas[1].estado,'indisponível nesta consulta');}finally{globalThis.fetch=old;}});
test('webhook recusa assinatura ausente, adulteração e segredo errado',async()=>{const raw='{"object":"whatsapp_business_account"}',secret='segredo-de-teste-nao-real';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(raw));const sig='sha256='+Buffer.from(bytes).toString('hex');assert.equal(await assinaturaValida(raw,sig,secret),true);assert.equal(await assinaturaValida(raw+' ',sig,secret),false);assert.equal(await assinaturaValida(raw,sig,'outro'),false);assert.equal(await assinaturaValida(raw,null,secret),false);});

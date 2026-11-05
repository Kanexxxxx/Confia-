export type Sinal={titulo:string; detalhe:string; nivel:'atencao'|'informacao'};
export type Resultado={alvo:string; dominio:string; parecer:'alerta_confirmado'|'atencao'|'inconclusivo'; sinais:Sinal[]; consultas:{fonte:string; estado:string}[]; limites:string[]};
export function endereco(value:string) {
  const raw=value.trim();
  if(raw.length>2048) throw new Error('O endereço é muito longo.');
  let url:URL;
  try { url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw)?raw:`https://${raw}`); }
  catch { throw new Error('Informe um endereço de site válido.'); }
  const h=url.hostname.toLowerCase();
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password) throw new Error('Use um endereço HTTP ou HTTPS sem usuário ou senha.');
  if(!h.includes('.') || h.endsWith('.') || h.includes(':') || /^\d+(\.\d+){3}$/.test(h) || /\.(localhost|local|internal|test|invalid)$/i.test(h) || h.endsWith('.localhost')) throw new Error('Informe um domínio público. Endereços locais e IPs não são aceitos.');
  if(url.port) throw new Error('Endereços com porta personalizada não são aceitos.');
  url.hash=''; url.search='';
  return url;
}
export function sinaisDoEndereco(url:URL):Sinal[] {
  const h=url.hostname;
  const sinais:Sinal[]=[];
  if(url.protocol==='http:') sinais.push({titulo:'Endereço sem HTTPS',detalhe:'A conexão informada não usa HTTPS. Isso exige atenção, mas não comprova golpe.',nivel:'atencao'});
  if(h.includes('xn--')) sinais.push({titulo:'Domínio com caracteres internacionais',detalhe:'O endereço usa caracteres internacionais. Confira se o nome corresponde à empresa esperada.',nivel:'atencao'});
  if(['bit.ly','tinyurl.com','t.co','cutt.ly','is.gd','shorturl.at'].includes(h)) sinais.push({titulo:'Link encurtado',detalhe:'O destino final não foi aberto. Um encurtador pode esconder para onde o link leva.',nivel:'atencao'});
  if(h.split('.').length>4) sinais.push({titulo:'Muitos subdomínios',detalhe:'Confira o domínio principal à direita do endereço. Um nome de banco à esquerda não comprova vínculo com ele.',nivel:'atencao'});
  sinais.push({titulo:'Domínio identificado',detalhe:h,nivel:'informacao'});
  sinais.push({titulo:'HTTPS não comprova legitimidade',detalhe:'Até sites fraudulentos podem usar conexão criptografada.',nivel:'informacao'});
  return sinais;
}
export async function analisa(value:string, apiKey?:string):Promise<Resultado> {
  const url=endereco(value), sinais=sinaisDoEndereco(url);
  const consultas=[{fonte:'Estrutura do endereço',estado:'concluída'}];
  let confirmado=false;
  if(apiKey) {
    try {
      const response=await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:{clientId:'confia',clientVersion:'1.0'},threatInfo:{threatTypes:['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE'],platformTypes:['ANY_PLATFORM'],threatEntryTypes:['URL'],threatEntries:[{url:url.href}]}}),signal:AbortSignal.timeout(6000)});
      if(!response.ok) throw new Error('Consulta indisponível');
      const data=await response.json() as {matches?:unknown[]};confirmado=Boolean(data.matches?.length);
      consultas.push({fonte:'Google Safe Browsing',estado:confirmado?'alerta encontrado':'nenhum alerta na consulta — não garante segurança'});
    } catch { consultas.push({fonte:'Google Safe Browsing',estado:'indisponível nesta consulta'}); }
  } else consultas.push({fonte:'Google Safe Browsing',estado:'não configurado'});
  return {alvo:url.href,dominio:url.hostname,parecer:confirmado?'alerta_confirmado':sinais.some(x=>x.nivel==='atencao')?'atencao':'inconclusivo',sinais,consultas,limites:['O site de destino não foi aberto nem executado.','Esta análise preliminar não verifica entrega de compras, CNPJ, idade do domínio ou reputação.','Não informe senhas nem pague com base apenas neste resultado.','Parâmetros e fragmentos foram removidos para não guardar tokens ou dados pessoais.']};
}

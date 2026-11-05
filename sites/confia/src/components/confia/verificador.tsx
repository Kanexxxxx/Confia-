'use client';
import {useState,type FormEvent} from 'react';
import type {Resultado} from '@/lib/confia/analise';
export function ResultadoAnalise({resultado}:{resultado:Resultado}){
 const titulo=resultado.parecer==='alerta_confirmado'?'Alerta encontrado em fonte de proteção':resultado.parecer==='atencao'?'Há pontos que exigem atenção':'Resultado inconclusivo';
 return <section className="cf-resultado" aria-label="Resultado da análise"><h3>{titulo}</h3><p><b>{resultado.dominio}</b></p><p>Esta é uma análise preliminar. Não representa garantia de segurança.</p><ul>{resultado.sinais.map((s,i)=><li key={i}><b>{s.titulo}</b><br/>{s.detalhe}</li>)}</ul><h4>O que foi consultado</h4><ul>{resultado.consultas.map(c=><li key={c.fonte}>{c.fonte}: {c.estado}</li>)}</ul><details><summary>Limites desta análise</summary><ul>{resultado.limites.map(x=><li key={x}>{x}</li>)}</ul></details><a href="/conta?aba=historico">Ver no meu histórico</a></section>;
}
export function VerificadorReal(){
 const [alvo,setAlvo]=useState(''),[ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[resultado,setResultado]=useState<Resultado|null>(null),[entrar,setEntrar]=useState(false);
 async function enviar(e:FormEvent){e.preventDefault();setOcupado(true);setErro('');setResultado(null);setEntrar(false);try{const r=await fetch('/api/confia/verificar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alvo})});const d=await r.json() as Resultado & {erro?:string};if(!r.ok){setEntrar(r.status===401);throw new Error(d.erro??'Não foi possível analisar.');}setResultado(d);}catch(e){setErro(e instanceof Error?e.message:'Falha ao analisar.');}finally{setOcupado(false);}}
 return <div><form onSubmit={enviar} className="cf-form"><label htmlFor="cf-alvo">Endereço do site</label><input id="cf-alvo" name="alvo" value={alvo} onChange={e=>setAlvo(e.target.value)} placeholder="https://exemplo.com" maxLength={2048} required autoComplete="off"/><p className="cf-ajuda">Analisamos a estrutura do endereço. Prints e perfis ainda não são analisados. Entre para salvar o resultado.</p><button disabled={ocupado} type="submit">{ocupado?'Analisando…':'Analisar endereço'}</button></form>{erro&&<p role="alert">{erro} {entrar&&<a href="/entrar">Entrar na conta</a>}</p>}{resultado&&<ResultadoAnalise resultado={resultado}/>}</div>;
}

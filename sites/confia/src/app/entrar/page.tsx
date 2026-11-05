import Link from 'next/link';
import {getChatGPTUser,chatGPTSignInPath} from '@/lib/confia/identidade';
import {destinoLogin} from '@/lib/destino-login';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Entrar({searchParams}:{searchParams:Promise<{destino?:string}>}){const q=await searchParams;const destino=destinoLogin(q.destino??'/conta');const u=await getChatGPTUser();if(u)redirect(destino);return <main className="porta" id="conteudo"><Link className="porta-marca" href="/"><img src="/assets/logo-confia.svg" alt="Confia"/></Link><section className="cf-login"><h1>Entre no Confia</h1><p>Use sua conta do ChatGPT para acessar o histórico, acompanhar denúncias e cadastrar sua loja.</p><p>O Confia não recebe sua senha do ChatGPT.</p><a className="cf-botao" href={chatGPTSignInPath(destino)} target="_top">Continuar com ChatGPT</a><p><Link href="/privacidade">Privacidade</Link> · <Link href="/termos">Termos de uso</Link></p></section></main>;}

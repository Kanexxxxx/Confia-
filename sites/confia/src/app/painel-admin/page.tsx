import {requireChatGPTUser} from '@/lib/confia/identidade';
import {ehDono} from '@/lib/confia/acesso';
import {notFound} from 'next/navigation';
import {Cabecalho,Rodape} from '@/components/moldura';
import {Administracao} from '@/components/confia/admin';
export const dynamic='force-dynamic';
export default async function Admin(){const u=await requireChatGPTUser('/painel-admin');if(!ehDono(u.email))notFound();return <><Cabecalho/><main id="conteudo" className="cf-area"><h1>Painel do Confia</h1><Administracao/></main><Rodape/></>;}

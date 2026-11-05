import {requireChatGPTUser,chatGPTSignOutPath} from '@/lib/confia/identidade';
import {ehDono} from '@/lib/confia/acesso';
import {Cabecalho,Rodape} from '@/components/moldura';
export const dynamic='force-dynamic';
export default async function LayoutConta({children}:{children:React.ReactNode}){const u=await requireChatGPTUser('/conta');return <><Cabecalho/><main id="conteudo" className="cf-area"><header className="cf-cabeca"><div><p className="eyebrow">Sua área</p><h1>Minha conta</h1><p>{u.displayName}</p></div><div>{ehDono(u.email)&&<a href="/painel-admin">Administração</a>} <a href={chatGPTSignOutPath('/')} target="_top">Sair</a></div></header>{children}</main><Rodape/></>;}

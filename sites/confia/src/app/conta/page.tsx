import {requireChatGPTUser} from '@/lib/confia/identidade';
import {Conta} from '@/components/confia/conta';
export const dynamic='force-dynamic';
export default async function Pagina({searchParams}:{searchParams:Promise<{aba?:string}>}){const u=await requireChatGPTUser('/conta');const q=await searchParams;return <Conta nome={u.displayName} email={u.email} abaInicial={q.aba??'verificar'}/>;}

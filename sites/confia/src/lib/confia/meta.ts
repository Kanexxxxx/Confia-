import 'server-only';
import { FalhaHttp } from './acesso';
export function configuracaoMeta(){
 const version=process.env.META_GRAPH_VERSION,token=process.env.META_ACCESS_TOKEN,waba=process.env.META_WABA_ID;
 if(!version||!/^v\d+\.\d+$/.test(version)||!token||!waba||!/^\d+$/.test(waba))throw new FalhaHttp(503,'Configure META_GRAPH_VERSION, META_ACCESS_TOKEN e META_WABA_ID para conectar a conta da Meta.');
 return {version,token,waba};
}
export { assinaturaValida } from './assinatura-meta';

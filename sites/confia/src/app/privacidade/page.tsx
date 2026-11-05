import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Privacidade } from '@/app/_portado/Privacidade';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'O que o confia? guarda, por quanto tempo, e como você pede para apagar.',
};

export default function Pagina() {
  return (
    <>
      <Cabecalho />
      <div id="conteudo">
        <section className="cf-area cf-painel"><h1>Dados usados nesta versão do Confia</h1><p>O acesso usa a conta do ChatGPT. Recebemos um identificador da conta, e-mail e nome quando disponíveis. Não recebemos sua senha. O nome de perfil, análises preliminares de endereços, denúncias e cadastros de lojas ficam no banco desta hospedagem, associados à sua conta.</p><p>Não abrimos os endereços enviados. Parâmetros e fragmentos são removidos antes da consulta e do histórico. Se a proteção Google Safe Browsing estiver configurada, o endereço normalizado é enviado ao Google para verificar alertas.</p><p>Imagens e leitura por IA ainda não são oferecidas nesta versão. Os formulários de denúncia são privados, acessíveis ao solicitante e à administração autorizada. Você pode exportar seus dados na conta e solicitar exclusão pelo contato indicado abaixo.</p><p>Os modelos de WhatsApp podem ser enviados à Meta para aprovação pelo administrador. O envio de mensagens a clientes ainda não está ativado. Eventos de aprovação guardam somente identificadores e status dos modelos.</p></section><Privacidade />
      </div>
      <Rodape />
    </>
  );
}

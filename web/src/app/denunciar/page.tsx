/* =============================================================
   confiia.com.br — /denunciar

   ─────────────────────────────────────────────────────────────
   A ORDEM DOS BLOCOS É UMA DECISÃO, NÃO UM ACASO

   "Perdeu dinheiro agora?" vem ANTES do formulário na ordem do
   HTML. Em tela estreita, onde a lateral cai para baixo, isso
   normalmente jogaria o socorro para o fim da página — depois de
   um formulário de dez campos.

   Aqui é o contrário: quem chegou com dinheiro saindo da conta
   precisa ligar para o banco AGORA. A denúncia espera cinco
   minutos; o Mecanismo Especial de Devolução do Pix, não.

   No computador o CSS devolve a lateral para o lado direito.
   ─────────────────────────────────────────────────────────────
   ============================================================= */

import type { Metadata } from 'next';
import { Cabecalho, Rodape } from '@/components/moldura';
import { FormaDenuncia } from './forma';

export const metadata: Metadata = {
  title: 'Denunciar golpe',
  description:
    'Conte o que aconteceu. Cada denúncia derruba a nota do site, do perfil ou do '
    + 'número — e avisa a próxima pessoa que verificar. Anônima por padrão.',
};

export const dynamic = 'force-dynamic';

export default function Denunciar() {
  return (
    <>
      <Cabecalho atual="/denunciar" />

      <main id="conteudo">
        <div className="capa">
          <p className="eyebrow">
            <i className="bi bi-megaphone" aria-hidden="true" /> Denunciar golpe
          </p>
          <h1>
            Conte o que aconteceu.
            <br />
            A próxima pessoa não cai.
          </h1>
          <p className="lead">
            Cada denúncia entra na nossa base e derruba a nota do site, do perfil ou do
            número denunciado. Quando alguém verificar aquilo depois, já vai aparecer o
            aviso.
          </p>
        </div>

        <div className="corpo">
          {/* Socorro primeiro. Ver o comentário do topo. */}
          <aside className="lateral">
            <div className="bloco bloco--urgente pane">
              <h2>
                <i className="bi bi-life-preserver" aria-hidden="true" /> Perdeu dinheiro
                agora?
              </h2>
              <p>Antes de qualquer coisa, faça isto — nesta ordem:</p>
              <ol>
                <li>
                  <b>Ligue para o seu banco</b> e peça o Mecanismo Especial de Devolução.
                  Se foi Pix, há chance de reaver.
                </li>
                <li>
                  <b>Registre boletim de ocorrência</b> — dá para fazer online, na
                  delegacia eletrônica do seu estado.
                </li>
                <li>
                  <b>Troque as senhas</b> que você digitou em qualquer página suspeita.
                </li>
                <li>
                  <b>Avise seus contatos</b> se a conta que te chamou era de alguém
                  conhecido.
                </li>
              </ol>
            </div>

            <div className="bloco pane">
              <h2>
                <i className="bi bi-clock-history" aria-hidden="true" /> O que acontece
                depois
              </h2>
              <p>
                A gente confere a denúncia, cruza com outras do mesmo alvo e, confirmando,
                o site ou número passa a aparecer marcado para todo mundo que verificar.
                Se você deixou e-mail, contamos o desfecho.
              </p>
            </div>

            <div className="bloco pane">
              <h2>
                <i className="bi bi-image" aria-hidden="true" /> Tem print da conversa?
              </h2>
              <p>
                <b>Guarde.</b> O envio de imagem entra junto com a análise automática, e
                a gente pede quando chegar lá. Antes de mandar qualquer print para
                alguém, tampe número de cartão, senha e endereço.
              </p>
            </div>
          </aside>

          <div className="folha">
            <div className="passos">
              <i>1</i>{' '}
              <span>Leva uns 3 minutos. Só o essencial é obrigatório.</span>
            </div>

            <FormaDenuncia />
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}

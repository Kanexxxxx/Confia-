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
import { carimboDeAgora } from '@/lib/armadilha';

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
                {/* O MED COM O PRAZO VEIO DA HOME — 27/08/2026

                    Na home ele estava dentro de "o que a gente não
                    consegue verificar", e aquele bloco perdeu a
                    parte bancária (a gente não vai atrás de banco).
                    Mas o prazo é a informação do site inteiro que
                    mais faz dinheiro voltar, então mudou de lugar
                    em vez de sumir — e este é o lugar certo: aqui
                    está quem JÁ perdeu, não quem veio conferir um
                    link antes de clicar.

                    Os 80 dias são regra do Banco Central. Se ela
                    mudar, muda aqui — hoje é o único lugar do site
                    onde esse número aparece. */}
                <li>
                  <b>Peça o MED, e conte os dias.</b> O Mecanismo Especial de Devolução do
                  Banco Central dá <b>80 dias corridos</b> para contestar um Pix — pelo seu
                  próprio aplicativo, dentro do extrato. Mas pedir <b>no mesmo dia</b> muda
                  muito a chance de voltar: o golpista ainda não tirou o dinheiro da conta.
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

            {/* DOIS BLOCOS SAÍRAM DAQUI — 27/08/2026

                "O QUE ACONTECE DEPOIS" foi para a tela de obrigado
                (`denunciar/forma.tsx`). A dona do projeto: "a pessoa
                não deveria saber esse tipo de informação [antes];
                é bom mostrar assim que ela enviar a denúncia".

                Ela tem razão e o motivo é de foco: quem está
                preenchendo precisa conseguir preencher. Explicar o
                nosso processo interno ANTES do envio é assunto
                nosso ocupando a cabeça de quem veio resolver o
                problema dela. Depois do envio, a mesma frase vira
                exatamente o que a pessoa quer saber.

                "TEM PRINT DA CONVERSA?" saiu porque mandava a
                pessoa GUARDAR e ESPERAR a gente pedir. Assim que o
                anexo de provas existir no formulário, essa espera
                deixa de fazer sentido — ela anexa na hora. O aviso
                de guardar as provas foi para a tela de obrigado,
                que é onde ele continua servindo (para BO e para
                contestação no banco).

                ⚠ SOBROU UM BLOCO SÓ NA LATERAL, de propósito. Você
                tinha dito que era "informação demais, junto". Com
                um, ele é a primeira coisa que a pessoa lê — e é o
                que salva dinheiro. Não encha esta lateral de novo.
                ───────────────────────────────────────────── */}
          </aside>

          <div className="folha">
            <div className="passos">
              <i>1</i>{' '}
              <span>Leva uns 3 minutos. Só o essencial é obrigatório.</span>
            </div>

            <FormaDenuncia carimbo={carimboDeAgora()} />
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}

/* =============================================================
   GERADO por scripts/porta-pagina.mjs a partir de
   reembolso.html

   Cabeçalho e rodapé foram removidos daqui: agora vêm de
   src/components/moldura.tsx, num lugar só. Os endereços .html
   do protótipo viraram rotas de verdade.
   ============================================================= */

export function Reembolso() {
  return (
    <>

      <div className="doc">
        <div className="doc-capa">
          <h1>Cancelamento e Reembolso</h1>
          <div className="doc-meta">
            <span>Versão <b>1.0</b></span>
            <span>Em vigor desde <b>1º de setembro de 2026</b></span>
          </div>
        </div>

        <main className="doc-corpo folha" id="conteudo">

          <div className="nota-doc nota-doc--info">
            <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
            <p><b>Resumo em três linhas:</b> você cancela quando quiser, sozinho, sem ligar pra ninguém.
            Desistiu em até 7 dias e quase não usou? Devolvemos tudo. Já usou bastante?
            Devolvemos a parte que sobrou.</p>
          </div>

          <h2 id="cancelar">1. Cancelar o plano</h2>
          <p>O cancelamento é feito por você mesmo, em <b>Minha conta → Plano → Cancelar assinatura</b>.
          Não pedimos motivo, não colocamos atendente para tentar te convencer e não existe multa.</p>
          <p>Ao cancelar:</p>
          <ul>
            <li>O plano <b>continua valendo até o fim do período já pago</b>. Você não perde o que comprou.</li>
            <li>A próxima cobrança não acontece.</li>
            <li>Seu histórico continua na conta. Se voltar depois, está tudo lá.</li>
          </ul>

          <hr />

          <h2 id="arrependimento">2. Desistiu em até 7 dias</h2>
          <p>O <b>Código de Defesa do Consumidor (art. 49)</b> dá a você 7 dias corridos para desistir de
          uma compra feita pela internet. A gente respeita isso — com uma regra a mais, explicada abaixo,
          porque serviço consumido não volta pra prateleira.</p>

          <h3>2.1. Usou pouco: devolvemos tudo</h3>
          <p>Se dentro dos 7 dias você usou <b>até 20% do limite do seu plano</b>, devolvemos
          <b>100% do valor pago</b>. Sem pergunta, sem desconto.</p>
          <table><tbody>
            <tr><th>Plano</th><th>Até quantas verificações</th><th>Devolução</th></tr>
            <tr><td>Básico (30/mês)</td><td>6 verificações</td><td>Integral</td></tr>
            <tr><td>Premium (150/mês)</td><td>30 verificações</td><td>Integral</td></tr>
          </tbody></table>

          <h3>2.2. Usou bastante: devolvemos o que sobrou</h3>
          <p>Se você passou desses 20%, devolvemos o valor <b>menos a parte que você já usou</b>.
          Cada verificação tem um valor proporcional dentro do plano — é essa conta que fazemos.</p>

          <div className="conta-exemplo">
            <b>Exemplo — Premium a R$ 24,90 com 150 verificações</b>
            <table><tbody>
              <tr><td>Valor de cada verificação (R$ 24,90 ÷ 150)</td><td>R$ 0,166</td></tr>
              <tr><td>Você usou 60 verificações</td><td>− R$ 9,96</td></tr>
              <tr><td>Devolvido</td><td>R$ 14,94</td></tr>
            </tbody></table>
          </div>

          <p>Isso vale para verificações, imagens analisadas e revisões humanas —
          cada uma tem custo real para nós no momento em que você usa.</p>

          <div className="nota-doc nota-doc--aviso">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
            <p><b>Por que é assim:</b> cada verificação custa dinheiro de verdade no instante em que
            acontece — servidor, análise por inteligência artificial, consultas externas. Devolver 100%
            para quem consumiu o plano inteiro faria o serviço quebrar, e quem pagaria a conta seriam
            os assinantes honestos. A regra acima é a forma justa: <b>você não paga pelo que não usou.</b></p>
          </div>

          <h3>2.3. Usou tudo</h3>
          <p>Se você consumiu <b>100% do limite</b> dentro dos 7 dias, não há valor a devolver —
          o serviço foi integralmente prestado. Você pode cancelar a renovação normalmente.</p>

          <hr />

          <h2 id="depois">3. Depois de 7 dias</h2>
          <p><b>Plano mensal:</b> não há devolução do mês em andamento, porque ele já está sendo usado.
          Você cancela e não é cobrado no mês seguinte.</p>
          <p><b>Plano anual:</b> devolvemos os <b>meses cheios que ainda não começaram</b>, descontando
          o desconto anual que você recebeu — afinal, o preço menor existia por causa do compromisso de
          12 meses.</p>

          <div className="conta-exemplo">
            <b>Exemplo — Premium anual a R$ 199, cancelado no 5º mês</b>
            <table><tbody>
              <tr><td>Meses cheios restantes</td><td>7 meses</td></tr>
              <tr><td>Valor mensal considerado (sem o desconto anual)</td><td>R$ 24,90</td></tr>
              <tr><td>Já usado: 5 meses × R$ 24,90</td><td>− R$ 124,50</td></tr>
              <tr><td>Devolvido</td><td>R$ 74,50</td></tr>
            </tbody></table>
          </div>

          <hr />

          <h2 id="cobranca-errada">4. Cobrança que não devia ter acontecido</h2>
          <p>Estes casos têm <b>devolução integral</b>, sem prazo e sem desconto:</p>
          <ul>
            <li>Cobrança duplicada;</li>
            <li>Cobrança depois de você já ter cancelado;</li>
            <li>Cobrança de plano que você não contratou;</li>
            <li>Serviço indisponível por falha nossa por mais de <b>72 horas seguidas</b>.</li>
          </ul>
          <p>Nesses casos, avise pelo suporte que resolvemos — normalmente no mesmo dia.</p>

          <hr />

          <h2 id="abuso">5. Uso indevido do reembolso</h2>
          <p>A regra acima existe para proteger quem age de boa-fé. Para que ela continue existindo,
          algumas condições:</p>
          <ul>
            <li>O reembolso por arrependimento vale <b>uma vez a cada 12 meses</b> por pessoa
            (identificada por CPF/CNPJ, e-mail e forma de pagamento).</li>
            <li>Contas criadas para repetir o ciclo <b>assinar → usar tudo → pedir de volta</b> podem ter
            o pedido recusado e a conta encerrada.</li>
            <li>Se identificarmos uso automatizado, revenda do acesso ou compartilhamento em massa
            da conta, o reembolso não se aplica.</li>
            <li>Quem já pediu reembolso pode assinar de novo, mas sem promoção de primeira assinatura.</li>
          </ul>
          <p>Sendo direto: a gente não vai brigar por causa de dinheiro com quem usou pouco e não gostou.
          Essas regras existem para o caso de quem usa o serviço inteiro e depois pede tudo de volta.</p>

          <hr />

          <h2 id="como">6. Como pedir</h2>
          <ol>
            <li>Entre em <b>Minha conta → Plano → Pedir reembolso</b>, ou fale com a gente.</li>
            <li>A tela mostra <b>quanto você já usou e o valor exato que será devolvido</b>,
            antes de você confirmar. Sem surpresa.</li>
            <li>Confirmando, o pedido é enviado.</li>
          </ol>

          <h3>Prazos</h3>
          <table><tbody>
            <tr><th>Etapa</th><th>Prazo</th></tr>
            <tr><td>Nossa resposta ao pedido</td><td>até 5 dias úteis</td></tr>
            <tr><td>Devolução via Pix</td><td>até 5 dias úteis após aprovado</td></tr>
            <tr><td>Estorno em cartão de crédito</td><td>1 a 2 faturas, conforme o banco emissor</td></tr>
          </tbody></table>
          <p>O estorno no cartão depende do seu banco, não de nós. Assim que a Asaas processa,
          o restante é com a operadora.</p>

          <hr />

          <h2 id="gratis">7. Plano grátis</h2>
          <p>Não existe cobrança, então não existe reembolso. Você pode parar de usar
          ou excluir a conta quando quiser.</p>

          <hr />

          <h2 id="falar">8. Falar com a gente</h2>
          <p>Se qualquer coisa aqui não fez sentido, ou se você acha que o seu caso é diferente,
          fala com a gente antes de abrir reclamação em qualquer lugar. Quase sempre é mais rápido resolver direto.</p>

          <p style={{ marginBottom: '20px' }}>
            <a className="zap" href="https://wa.me/5516997062339" target="_blank" rel="noopener">
              <i className="bi bi-whatsapp" aria-hidden="true"></i> (16) 99706-2339
            </a>
          </p>

          <ul>
            <li><b>WhatsApp:</b> (16) 99706-2339</li>
            <li><b>E-mail:</b> <a href="mailto:suporte@confiia.com.br">suporte@confiia.com.br</a></li>
          </ul>

          <hr />

          <div className="nota-doc nota-doc--aviso">
            <i className="bi bi-cone-striped" aria-hidden="true"></i>
            <p><b>Serviço em versão beta.</b> O confia? está em desenvolvimento e algumas funções
            ainda estão sendo construídas. Isso não reduz seus direitos — as regras acima valem
            integralmente. Este documento deve passar por revisão jurídica antes da publicação
            definitiva.</p>
          </div>

        </main>
      </div>


    </>
  );
}

/* =============================================================
   confiia.com.br — a tabela comparativa e as dúvidas de /planos

   Gerado a partir de prototipo/planos.html e conferido à mão.
   Fica separado de cartoes.tsx porque NÃO precisa de JavaScript:
   é texto e tabela, e vai inteiro pelo servidor.

   ─────────────────────────────────────────────────────────────
   POR QUE OS ÍCONES DA TABELA SÃO `aria-hidden`

   São mais de duzentos "✓" e "✗" na tabela. Sem `aria-hidden`,
   um leitor de tela anuncia cada um deles como um caractere
   solto, e a tabela vira ruído impossível de atravessar.

   A informação que importa está no cabeçalho da linha e da
   coluna — que é justamente como uma tabela deve ser lida.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - Mudar um limite aqui (30 verificações, 40 imagens) exige
       mudar em cartoes.tsx também. São dois lugares dizendo a
       mesma coisa para a mesma pessoa.
     - A `.rolagem` em volta da tabela é o que impede a página
       inteira de rolar de lado no celular. Não tire.
   ============================================================= */

/* ─────────────────────────────────────────────────────────────
   "ANTES DE ASSINAR" SAIU DESTE ARQUIVO

   Eram seis caixas soltas no fim da página, entre outras caixas.
   Ninguém lê aviso antes de ter a pergunta — e a pergunta "posso
   cancelar?" só existe na cabeça de quem está com o dedo no botão
   de assinar. Agora ela abre ali, no clique: ver `AntesDeAssinar`
   em `cartoes.tsx`.

   As duas que ficaram de fora (o que acontece ao bater o limite;
   se precisa de cartão para o grátis) viraram a explicação do
   próprio item dentro do cartão, que é onde a dúvida nasce.
   ───────────────────────────────────────────────────────────── */

export function DetalhesPlanos() {
  return (
    <section className="comparativo">
      <h2>Comparando item por item</h2>
      <p>Sem letra miúda. O que cada plano faz, do jeito que funciona de verdade.</p>

      <div className="rolagem">
        <table>
          <thead>
            <tr><th>Recurso</th><th>Grátis</th><th>Básico</th><th>Premium</th><th>Enterprise</th></tr>
          </thead>
          <tbody>
            <tr className="grupo"><th colSpan={5}>Volume</th></tr>
            <tr><th>Verificações por mês</th><td>5</td><td><b>30</b></td><td><b>150</b></td><td>combinado</td></tr>
            <tr><th>Sem estar logado</th><td>2</td><td>—</td><td>—</td><td>—</td></tr>
            <tr><th>Imagens por mês</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td>5</td><td><b>40</b></td><td>combinado</td></tr>
            <tr><th>Verificar várias de uma vez</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td>2 por vez</td><td><b>10 por vez</b></td><td>em lote</td></tr>

            <tr className="grupo"><th colSpan={5}>O que dá pra verificar</th></tr>
            <tr><th>Link e endereço de site</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Perfil de rede social</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Loja e marketplace</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Print de conversa</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Foto de anúncio e produto</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Site de jogo, skin e case</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Análise de imagem</th></tr>
            <tr><th>Lê o texto do print</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Detecta imagem feita por IA</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Procura a foto em outros sites</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Confere selo de origem da imagem</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Conta e histórico</th></tr>
            <tr><th>Histórico de consultas</th><td>7 dias</td><td>completo</td><td>completo</td><td>completo</td></tr>
            <tr><th>Busca no histórico</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Pessoas na mesma conta</th><td>1</td><td>1</td><td><b>5</b></td><td>equipe</td></tr>
            <tr><th>Exportar em PDF</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Onde funciona</th></tr>
            <tr><th>Site</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Extensão de navegador</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Aplicativo no celular</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Compartilhar direto do WhatsApp</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Proteção contínua</th></tr>
            <tr><th>Aviso se um site aprovado mudar</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Alerta de vazamento de dados</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Resumo mensal</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Suporte</th></tr>
            <tr><th>Central de ajuda</th><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Resposta por e-mail</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td>24h</td><td><b>8h</b></td><td>SLA</td></tr>
            <tr><th>Revisão humana da análise</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><b>até 2h</b></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Atendimento ao vivo</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>

            <tr className="grupo"><th colSpan={5}>Para empresas</th></tr>
            <tr><th>API e webhooks</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Integrações</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
            <tr><th>Nota fiscal e contrato</th><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-x-lg nao" aria-hidden="true"></i></td><td><i className="bi bi-check-lg sim" aria-hidden="true"></i></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =============================================================
   GERADO por scripts/porta-pagina.mjs a partir de
   cookies.html

   Cabeçalho e rodapé foram removidos daqui: agora vêm de
   src/components/moldura.tsx, num lugar só. Os endereços .html
   do protótipo viraram rotas de verdade.
   ============================================================= */

export function Cookies() {
  return (
    <>

      <div className="doc">
        <div className="doc-capa">
          <h1>Cookies</h1>
          <div className="doc-meta">
            <span>Versão <b>1.0</b></span>
            <span>Em vigor desde <b>1º de setembro de 2026</b></span>
          </div>
        </div>

        <main className="doc-corpo folha" id="conteudo">

          <div className="nota-doc nota-doc--info">
            <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
            <p><b>Resumo:</b> usamos o mínimo possível. Nenhum cookie de propaganda, nenhum rastreador
            de rede social, nada vendido para ninguém.</p>
          </div>

          <h2 id="oque">1. O que é um cookie</h2>
          <p>É um arquivinho de texto que o site guarda no seu navegador. Serve para lembrar de coisas
          entre uma página e outra — por exemplo, que você já entrou na sua conta e não precisa
          digitar a senha de novo a cada clique.</p>

          <hr />

          <h2 id="usamos">2. Os que usamos</h2>

          <h3>Necessários</h3>
          <p>Sem eles o site não funciona. Por isso não dependem de autorização.</p>
          <table><tbody>
            <tr><th>Nome</th><th>Para quê</th><th>Duração</th></tr>
            <tr><td><code>confia_sessao</code></td><td>Manter você conectado à sua conta</td><td>30 dias</td></tr>
            <tr><td><code>confia_csrf</code></td><td>Impedir que outro site faça ações na sua conta</td><td>Sessão</td></tr>
            <tr><td><code>confia_cookies</code></td><td>Guardar a escolha que você fez nesta página</td><td>12 meses</td></tr>
            <tr><td><code>confia_limite</code></td><td>Controlar as 2 verificações de quem não tem conta</td><td>24 horas</td></tr>
          </tbody></table>

          <h3>De medição</h3>
          <p>Ajudam a entender quais páginas as pessoas usam e onde travam, sempre de forma agregada —
          nunca individual. <b>Só com a sua autorização.</b></p>
          <table><tbody>
            <tr><th>Nome</th><th>Para quê</th><th>Duração</th></tr>
            <tr><td><code>confia_uso</code></td><td>Contar visitas e caminhos dentro do site</td><td>12 meses</td></tr>
          </tbody></table>

          <h3>O que não usamos</h3>
          <ul>
            <li>Cookies de propaganda ou remarketing;</li>
            <li>Pixel de rede social (Meta, TikTok, Google Ads);</li>
            <li>Venda ou troca de dados com corretoras de audiência.</li>
          </ul>

          <hr />

          <h2 id="escolher">3. Sua escolha</h2>
          <p>Você decide agora e pode voltar aqui quando quiser para mudar.</p>

          <div className="escolha">
            <div className="txt">
              <b>Necessários</b>
              <p>Login, segurança e a sua própria escolha de cookies. Não dá para desligar
              porque o site deixaria de funcionar.</p>
              <span className="fixo">Sempre ativos</span>
            </div>
            <label className="chave">
              <input type="checkbox" checked disabled aria-label="Cookies necessários, sempre ativos" />
              <i></i>
            </label>
          </div>

          <div className="escolha">
            <div className="txt">
              <b>De medição</b>
              <p>Nos ajuda a entender o que melhorar. Desligando, o site continua igual para você.</p>
            </div>
            <label className="chave">
              <input type="checkbox" id="medicao" aria-label="Cookies de medição" />
              <i></i>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button className="btn btn--forte" id="salvar" type="button">
              <i className="bi bi-check-lg" aria-hidden="true"></i> Salvar escolha
            </button>
            <button className="btn btn--calmo" id="recusar" type="button">Só os necessários</button>
          </div>
          <div id="resposta" style={{ marginTop: '16px' }}></div>

          <hr />

          <h2 id="navegador">4. Apagar pelo navegador</h2>
          <p>Você também pode apagar ou bloquear cookies direto nas configurações do seu navegador.
          Bloqueando os necessários, o login deixa de funcionar — não é problema do site,
          é como cookies funcionam.</p>

          <hr />

          <h2 id="mais">5. Saber mais</h2>
          <p>O que fazemos com dados pessoais está na
          <a href="/privacidade">Política de Privacidade</a>. Dúvida sobre cookies pode ser
          enviada para <a href="mailto:privacidade@confiia.com.br">privacidade@confiia.com.br</a>.</p>

        </main>
      </div>




    </>
  );
}

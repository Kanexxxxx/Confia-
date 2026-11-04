/* Suspense real do roteador: aparece só enquanto a página está sendo lida.
 * Não há cronômetro, porcentagem inventada ou atraso para mostrar animação.
 */
export default function Carregando() {
  return <main className="pagina-aguardando" id="conteudo" aria-busy="true">
    <p role="status" className="sr">Abrindo a página…</p>
    <div className="esqueleto-titulo" aria-hidden="true" />
    <div className="esqueleto-linha" aria-hidden="true" />
    <div className="esqueleto-paineis" aria-hidden="true"><span /><span /><span /></div>
  </main>;
}

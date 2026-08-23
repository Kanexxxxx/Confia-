/* =============================================================
   confiia.com.br — a porta do painel administrativo

   O ENDEREÇO VEM DO AMBIENTE, NÃO DO CÓDIGO.
   Este repositório é público. Caminho escrito aqui seria caminho
   público — e aí não seria caminho secreto nenhum.

   Fica assim:  confiia.com.br/<PAINEL_CAMINHO>/painel

   AS TRÊS TRANCAS, DA MAIS FRACA PARA A MAIS FORTE:

     1. o endereço não é adivinhável
        Vale pouco. Serve só para os robôs que varrem /admin e
        /wp-admin não encherem o log. No dia em que o endereço
        aparecer num print, esta tranca acabou.

     2. quem não é admin recebe 404
        Não recebe tela de login, não recebe "acesso negado".
        A mesma resposta de qualquer endereço inventado — então
        nem dá para descobrir que o painel existe.

     3. sessão + tabela `admins` + SEGUNDO FATOR + 12 horas
        Esta é a que segura. Saber a senha não basta: sem o código
        do celular, `admin_pode_entrar` devolve false no banco e a
        pessoa cai no 404 igual.

   CUIDADO AO MEXER:
     - `exigeAdmin()` é a primeira linha. Não mova, não condicione,
       não coloque nada antes que leia dado.
     - As cinco telas do painel (que já estão desenhadas em
       prototipo/admin.html) entram na Etapa 10, ligadas no banco.
       Aqui está só a porta — e ela já está trancada.
   ============================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigeAdmin, caminhoDoPainelConfere } from '@/lib/guarda';

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Painel({
  params,
}: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;

  /* Caminho errado: 404, antes de qualquer consulta ao banco. */
  if (!caminhoDoPainelConfere(chave)) notFound();

  /* Não é admin, ou é admin sem 2FA: 404 também. */
  const quem = await exigeAdmin();

  return (
    <main className="folha-conta" id="conteudo">
      <header className="cabeca-conta">
        <div>
          <h1>Painel</h1>
          <p>{quem.nome} · sessão de 12 horas</p>
        </div>
        <Link className="btn btn--calmo btn--linha" href="/conta">
          <i className="bi bi-arrow-left" aria-hidden="true" /> Minha conta
        </Link>
      </header>

      <section className="bloco" style={{ borderColor: 'rgba(47,211,155,.3)' }}>
        <h2>Porta trancada</h2>
        <div className="linha">
          <span className="rot">Endereço fora do código</span>
          <span className="val"><span className="selo selo--ok">sim</span></span>
        </div>
        <div className="linha">
          <span className="rot">Segundo fator conferido no banco</span>
          <span className="val"><span className="selo selo--ok">sim</span></span>
        </div>
        <div className="linha">
          <span className="rot">Quem não é admin recebe</span>
          <span className="val">404, não &quot;acesso negado&quot;</span>
        </div>
        <div className="linha">
          <span className="rot">Duração da sessão</span>
          <span className="val">12 horas</span>
        </div>
      </section>

      <section className="bloco">
        <h2>As telas vêm na Etapa 10</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: 'rgba(234,241,253,.74)' }}>
          Dashboard, fila de moderação, contas, empresas e custos já estão
          desenhadas em <code style={{ color: 'var(--sky-soft)' }}>prototipo/admin.html</code>.
          Elas são ligadas no banco na Etapa 10, depois que houver o que moderar.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: 'rgba(234,241,253,.55)' }}>
          A ordem é essa de propósito: a tranca vem antes do conteúdo. Painel
          bonito e destrancado é pior que painel nenhum.
        </p>
      </section>
    </main>
  );
}

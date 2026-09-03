/* =============================================================
   confiia.com.br — a moldura do painel da conta

   Antes, /conta era UMA página comprida com tudo empilhado —
   dados, aparelhos, privacidade, administração — e sem nem
   cabeçalho do site. Agora é um painel: barra lateral fixa à
   esquerda com quem você é e para onde ir, conteúdo à direita.

   ─────────────────────────────────────────────────────────────
   POR QUE A SESSÃO É LIDA AQUI, E NÃO EM CADA PÁGINA

   Este layout envolve TODAS as rotas de /conta. Ler a sessão
   aqui significa que nenhuma subpágina pode esquecer de checar —
   a proteção não depende de quem escreveu a página nova lembrar
   dela. É a diferença entre "protegido por convenção" e
   "protegido por construção".

   Cada página AINDA lê a sessão para os dados dela. Isso não é
   desperdício: é a garantia de que uma página nunca renderiza
   dado de uma sessão que expirou entre o layout e ela.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - `force-dynamic` é obrigatório: a página mostra dado de
       gente logada. Uma versão em cache seria a conta de uma
       pessoa aparecendo para outra — o pior defeito possível
       aqui.
     - Item novo no menu exige pasta nova em src/app/conta/.
   ============================================================= */

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { sair } from '@/lib/acoes-conta';
import { Cabecalho, Rodape } from '@/components/moldura';
import { Avatar } from '@/components/avatar';
import { MenuConta, type ItemConta } from '@/components/menu-conta';

export const dynamic = 'force-dynamic';

export default async function LayoutConta({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const quem = await sessaoAtual();
  if (!quem) redirect('/entrar?destino=/conta');

  const [perfil] = await db
    .select({
      apelido: contas.apelido,
      avatar: contas.avatar,
      totpAtivadoEm: contas.totpAtivadoEm,
    })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const apelido = perfil?.apelido || quem.nome.split(' ')[0];

  const itens: ItemConta[] = [
    { href: '/conta', texto: 'Visão geral', icone: 'bi-grid-1x2' },
    { href: '/conta/perfil', texto: 'Perfil e avatar', icone: 'bi-person-badge' },
    {
      href: '/conta/seguranca',
      texto: 'Segurança',
      icone: 'bi-shield-lock',
      /* O aviso aparece no MENU, não só dentro da página: quem não
         ligou o segundo fator provavelmente nunca abriu essa aba. */
      aviso: perfil?.totpAtivadoEm ? undefined : 'ligar 2FA',
    },
    { href: '/conta/aparelhos', texto: 'Aparelhos', icone: 'bi-laptop' },
    { href: '/conta/plano', texto: 'Plano e uso', icone: 'bi-stars' },
    { href: '/conta/privacidade', texto: 'Privacidade', icone: 'bi-file-lock2' },
  ];

  return (
    <>
      <Cabecalho />

      <main className="painel" id="conteudo">
        <aside className="painel-lado">
          <div className="painel-quem">
            <Avatar nome={quem.nome} avatar={perfil?.avatar ?? 'inicial'} tamanho={64} />
            <div className="painel-quem-texto">
              <b>{apelido}</b>
              <span title={quem.email}>{quem.email}</span>
            </div>
          </div>

          <MenuConta itens={itens} />

          {/* Sair fica separado do resto por uma linha: é a única
              ação do menu que desfaz alguma coisa, e não deve ficar
              a um clique de distância de "Perfil". */}
          <form action={sair} className="painel-sair">
            <button type="submit" className="conta-nav-item conta-nav-item--sair">
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              <span>Sair da conta</span>
            </button>
          </form>
        </aside>

        <div className="painel-conteudo">{children}</div>
      </main>

      <Rodape />
    </>
  );
}

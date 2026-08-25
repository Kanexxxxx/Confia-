/* =============================================================
   confiia.com.br — cabeçalho e rodapé

   No protótipo, cada uma das dez páginas trazia a sua cópia
   destes dois blocos. Mudar um link do menu era mudar dez
   arquivos — e esquecer um. Aqui é um lugar só.

   ─────────────────────────────────────────────────────────────
   O CABEÇALHO DE VIDRO É O PADRÃO AGORA

   No protótipo ele existia só na home e em planos; as páginas
   legais usavam uma versão simples. Isso era inconsistência de
   quem escreveu, não decisão de design — o vidro é a assinatura
   da marca e agora vale em todo lugar.

   As camadas (.lg-refract, .lg-tint, .lg-shine) são o efeito.
   O filtro SVG que elas usam mora no layout, definido uma vez.
   ─────────────────────────────────────────────────────────────

   O CABEÇALHO SABE QUEM ESTÁ LOGADO: mostra "Entrar" para quem
   não está, e o bicho escolhido + o apelido para quem está. Por
   isso é componente de servidor: a sessão nunca chega ao
   navegador.

   CUIDADO AO MEXER:
     - O deslocamento do filtro é proporcional à ALTURA do
       elemento. O da pílula do menu (52px) usa escala 10; o do
       card grande usa 30. Trocar sem recalcular deixa borda
       fantasma — já aconteceu.
   ============================================================= */

import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { Avatar } from '@/components/avatar';
import { MenuVivo } from '@/components/menu-vivo';
import {
  CIDADE_LONGA, ANO_FUNDACAO, EMAIL_CONTATO, WHATSAPP_LINK, WHATSAPP_VISIVEL,
} from '@/lib/contato';

/* O MENU, E POR QUE ELE TEM ESTES CINCO ITENS

   "Como funciona" aponta para uma âncora da home (/#como) e não
   para uma página. Isso é de propósito: funciona de qualquer
   lugar do site, e a explicação não merece uma página só dela —
   ela precisa estar perto de quem acabou de chegar.

   E ela ENTRA na lista, apesar de ser a única âncora, porque boa
   parte de quem mais precisa deste site nunca usou um serviço
   assim. Um menu só com "Planos / Registrar loja / Denunciar"
   assume que a pessoa já entendeu o que a gente faz. Ela não
   entendeu — e é por isso que ela está aqui.

   CUIDADO AO MEXER:
     - Mexer aqui muda o cabeçalho de TODAS as páginas.
     - Item novo precisa de rota que exista: link morto no menu
       principal aparece em todo lugar de uma vez.
     - O indicador que desliza (menu-vivo.tsx) mede os itens no
       navegador, então não precisa de ajuste ao acrescentar um. */
const MENU = [
  { href: '/', texto: 'Confia?' },
  { href: '/#como', texto: 'Como funciona' },
  { href: '/planos', texto: 'Planos' },
  { href: '/registrar-loja', texto: 'Registrar loja' },
  { href: '/denunciar', texto: 'Denunciar' },
] as const;

export async function Cabecalho({ atual }: { atual?: string }) {
  const quem = await sessaoAtual();

  /* O apelido e o bicho só são buscados se houver alguém logado —
     visitante não gera consulta ao banco. */
  let apelido = '';
  let avatar = 'inicial';
  if (quem) {
    const [c] = await db
      .select({ apelido: contas.apelido, avatar: contas.avatar })
      .from(contas)
      .where(eq(contas.id, quem.id))
      .limit(1);
    apelido = c?.apelido || quem.nome.split(' ')[0];
    avatar = c?.avatar || 'inicial';
  }

  return (
    <header className="topbar" id="topbar">
      {/* desfoque em camadas: some suave em vez de cortar reto */}
      <div className="haze" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      <Link className="brand" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>

      <MenuVivo itens={MENU as unknown as { href: string; texto: string }[]} atual={atual} />

      {quem ? (
        <Link className="account" href="/conta">
          <Avatar nome={quem.nome} avatar={avatar} tamanho={36} />
          <span className="label rotulo">{apelido}</span>
        </Link>
      ) : (
        <Link className="account" href="/entrar">
          <span className="ring"><i className="bi bi-person-fill" aria-hidden="true" /></span>
          <span className="label rotulo">Entrar</span>
        </Link>
      )}
    </header>
  );
}

export function Rodape() {
  return (
    <footer>
      <div className="foot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
        <div className="links">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/reembolso">Reembolso</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/denunciar">Denunciar</Link>
          <a
            href="https://www.instagram.com/confia.iia/"
            target="_blank" rel="noopener noreferrer"
          >
            <i className="bi bi-instagram" aria-hidden="true" /> Instagram
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=100081737570267"
            target="_blank" rel="noopener noreferrer"
          >
            <i className="bi bi-facebook" aria-hidden="true" /> Facebook
          </a>
        </div>
        {/* A ASSINATURA DO RODAPÉ.

            Cidade e ano de fundação vêm de src/lib/contato.ts, e não
            escritos aqui: os mesmos dados aparecem nos documentos
            legais, e dois lugares divergindo sobre onde a empresa
            fica é o tipo de detalhe que derruba a confiança.

            NÃO tem endereço completo, e é de propósito: enquanto não
            houver CNPJ, o endereço seria o residencial de uma pessoa
            física. */}
        <div className="foot-assina">
          <span>© {ANO_FUNDACAO} confia? — confiia.com.br</span>
          <span className="foot-onde">
            <i className="bi bi-geo-alt" aria-hidden="true" /> Feito em {CIDADE_LONGA}
            {' · '}desde {ANO_FUNDACAO}
          </span>
          <span className="foot-onde">
            <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>
            {' · '}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <i className="bi bi-whatsapp" aria-hidden="true" /> {WHATSAPP_VISIVEL}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

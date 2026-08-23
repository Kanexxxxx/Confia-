/* =============================================================
   confiia.com.br — cabeçalho e rodapé

   No protótipo, cada uma das dez páginas trazia a sua cópia
   destes dois blocos. Isso significa que mudar um link do menu
   era mudar dez arquivos — e esquecer um.

   Aqui é um lugar só.

   O CABEÇALHO SABE QUEM ESTÁ LOGADO: mostra "Entrar" para quem
   não está, e o bicho escolhido + o apelido para quem está. Por
   isso ele é componente de servidor: a sessão nunca chega ao
   navegador.

   CUIDADO AO MEXER:
     - Os endereços aqui são os de verdade (`/termos`), não os do
       protótipo (`termos.html`).
   ============================================================= */

import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { Avatar } from '@/components/avatar';

const MENU = [
  { href: '/', texto: 'Confia?' },
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
    <header className="topbar">
      <Link className="brand" href="/" aria-label="confia? — início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-confia.svg" alt="confia?" />
      </Link>

      <nav className="nav" aria-label="Principal">
        {MENU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            aria-current={atual === m.href ? 'page' : undefined}
          >
            {m.texto}
          </Link>
        ))}
      </nav>

      {quem ? (
        <Link className="account" href="/conta">
          <Avatar nome={quem.nome} avatar={avatar} tamanho={36} />
          <span className="rotulo">{apelido}</span>
        </Link>
      ) : (
        <Link className="account" href="/entrar">
          <span className="ring"><i className="bi bi-person-fill" aria-hidden="true" /></span>
          <span className="rotulo">Entrar</span>
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
        <span>© 2026 confia? — confiia.com.br</span>
      </div>
    </footer>
  );
}

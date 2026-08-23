import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { exigeLogin } from '@/lib/guarda';
import { quantosReservaRestam } from '@/lib/dois-fatores';
import { PainelSeguranca } from './painel';
import { Recado } from '@/components/campos';

export const metadata: Metadata = { title: 'Segurança da conta' };
export const dynamic = 'force-dynamic';

export default async function Seguranca({
  searchParams,
}: { searchParams: Promise<{ ligou?: string; desligou?: string }> }) {
  const quem = await exigeLogin('/conta/seguranca');
  const q = await searchParams;

  const [conta] = await db
    .select({ ativadoEm: contas.totpAtivadoEm })
    .from(contas)
    .where(eq(contas.id, quem.id))
    .limit(1);

  const ligado = Boolean(conta?.ativadoEm);
  const restam = ligado ? await quantosReservaRestam(quem.id) : 0;

  return (
    <main className="folha-conta" id="conteudo">
      <header className="cabeca-conta">
        <div>
          <h1>Segurança</h1>
          <p>Como a sua conta é protegida</p>
        </div>
        <Link className="btn btn--calmo btn--linha" href="/conta">
          <i className="bi bi-arrow-left" aria-hidden="true" /> Voltar
        </Link>
      </header>

      {q.ligou === '1' && (
        <Recado tipo="ok">
          <b>Segundo fator ligado.</b> Da próxima vez que entrar, o site vai pedir o
          código do seu celular.
        </Recado>
      )}
      {q.desligou === '1' && (
        <Recado tipo="aviso">
          <b>Segundo fator desligado.</b> Sua conta voltou a depender só da senha.
        </Recado>
      )}

      <PainelSeguranca ligado={ligado} restam={restam} ehAdmin={quem.ehAdmin} />

      <section className="bloco">
        <h2>Por que isso importa</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: 'rgba(234,241,253,.74)' }}>
          Sua senha, sozinha, é uma coisa que você <b>sabe</b>. Se ela vazar no
          vazamento de outro site — e vazam o tempo todo — quem tiver a lista entra
          na sua conta aqui.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.75, color: 'rgba(234,241,253,.74)' }}>
          O segundo fator acrescenta uma coisa que você <b>tem</b>: o celular na sua
          mão. Saber a senha deixa de bastar.
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: 'rgba(234,241,253,.55)' }}>
          Usamos o aplicativo autenticador, e não SMS, de propósito: o código nasce
          dentro do seu celular e não passa pela operadora. Não existe golpe do chip
          clonado contra ele — e esse é justamente um dos golpes que o confia? combate.
        </p>
      </section>
    </main>
  );
}

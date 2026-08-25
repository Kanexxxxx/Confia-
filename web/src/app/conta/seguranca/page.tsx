import type { Metadata } from 'next';
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
    <>
      {/* Sem <main> nem botão "voltar": os dois agora vêm do
          layout do painel (src/app/conta/layout.tsx), que já traz
          o cabeçalho do site e a barra lateral de navegação. */}
      <div className="painel-titulo">
        <h1>Segurança</h1>
        <p>
          Como a sua conta é protegida, e o que você pode ligar para deixá-la mais
          difícil de invadir.
        </p>
      </div>

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

      <section className="cartao" aria-labelledby="t-porque">
        <div className="cartao-topo">
          <div>
            <h2 id="t-porque">Por que isso importa</h2>
          </div>
        </div>

        <p className="cartao-texto">
          Sua senha, sozinha, é uma coisa que você <b>sabe</b>. Se ela vazar no
          vazamento de outro site — e vazam o tempo todo — quem tiver a lista entra na
          sua conta aqui.
        </p>
        <p className="cartao-texto">
          O segundo fator acrescenta uma coisa que você <b>tem</b>: o celular na sua
          mão. Saber a senha deixa de bastar.
        </p>
        <p className="cartao-texto cartao-texto--fraco">
          Usamos o aplicativo autenticador, e não SMS, de propósito: o código nasce
          dentro do seu celular e não passa pela operadora. Não existe golpe do chip
          clonado contra ele — e esse é justamente um dos golpes que o confia? combate.
        </p>
      </section>
    </>
  );
}

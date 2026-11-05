'use client';

/* =============================================================
   confiia.com.br — ligar e desligar o segundo fator

   O QR e o segredo só existem enquanto esta tela está aberta. Nada
   é gravado até a pessoa acertar um código — assim ninguém se
   tranca para fora por ter fechado a página no meio do caminho.

   CUIDADO AO MEXER:
     - Os dez códigos de reserva aparecem UMA vez. Se você mudar
       isso para "mostrar de novo depois", eles deixam de ser
       segredo: qualquer um que abra a conta aberta os copia.
   ============================================================= */

import { useState, useActionState } from 'react';
import {
  preparaDoisFatores, confirmaDoisFatores, desligaDoisFatoresAcao,
  novosCodigosReserva, type Estado2FA,
} from '@/lib/acoes-seguranca';
import { BotaoEnviar, Recado, CampoSenha } from '@/components/campos';

export function PainelSeguranca({
  ligado, restam, ehAdmin,
}: { ligado: boolean; restam: number; ehAdmin: boolean }) {
  const [passo, setPasso] = useState<'parado' | 'lendo' | 'desligando'>('parado');
  const [qr, setQr] = useState<{ segredo: string; legivel: string; qr: string } | null>(null);
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [estadoLigar, acaoLigar] = useActionState<Estado2FA, FormData>(confirmaDoisFatores, null);
  const [estadoDesligar, acaoDesligar] = useActionState<Estado2FA, FormData>(desligaDoisFatoresAcao, null);

  async function comecar() {
    setErro(null);
    try {
      setQr(await preparaDoisFatores());
      setPasso('lendo');
    } catch {
      setErro('Não consegui preparar agora. Tente de novo.');
    }
  }

  async function gerarCodigos() {
    setErro(null);
    try {
      setCodigos(await novosCodigosReserva());
    } catch {
      setErro('Não consegui gerar os códigos. Tente de novo.');
    }
  }

  /* ---------- já está ligado ---------- */
  if (ligado && passo !== 'desligando') {
    return (
      <>
        <section className="bloco">
          <h2>Segundo fator</h2>
          <div className="linha">
            <span className="rot">Aplicativo autenticador</span>
            <span className="val">
              <span className="selo selo--ok">
                <i className="bi bi-shield-check" aria-hidden="true" /> ligado
              </span>
            </span>
          </div>
          <div className="linha">
            <span className="rot">Códigos de reserva</span>
            <span className="val">
              {restam > 0
                ? <span className={restam <= 3 ? 'selo selo--aviso' : undefined}>{restam} de 10 sobrando</span>
                : <span className="selo selo--aviso">nenhum — gere agora</span>}
            </span>
          </div>

          {restam <= 3 && (
            <div style={{ marginTop: 14 }}>
              <Recado tipo="aviso">
                {restam === 0
                  ? 'Você não tem códigos de reserva. Se perder o celular, perde a conta.'
                  : 'Restam poucos códigos de reserva. Gere um lote novo enquanto dá.'}
              </Recado>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn--calmo btn--linha" type="button" onClick={gerarCodigos}>
              <i className="bi bi-key" aria-hidden="true" /> Gerar novos códigos de reserva
            </button>
            {!ehAdmin && (
              <button
                className="btn btn--calmo btn--linha"
                type="button"
                onClick={() => setPasso('desligando')}
              >
                Desligar
              </button>
            )}
          </div>

          {ehAdmin && (
            <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.7, color: 'rgba(234,241,253,.55)' }}>
              Sua conta administra o painel, então o segundo fator não pode ser desligado.
              O próprio banco recusa.
            </p>
          )}
          {erro && <div style={{ marginTop: 14 }}><Recado tipo="erro">{erro}</Recado></div>}
        </section>

        {codigos && <ListaDeCodigos codigos={codigos} />}
      </>
    );
  }

  /* ---------- desligando ---------- */
  if (passo === 'desligando') {
    return (
      <section className="bloco">
        <h2>Desligar o segundo fator</h2>
        <Recado tipo="aviso">
          Sua conta volta a depender <b>só da senha</b>. Se ela vazar no vazamento de
          outro site, quem tiver a lista entra aqui.
        </Recado>
        {estadoDesligar?.erro && <Recado tipo="erro">{estadoDesligar.erro}</Recado>}

        <form action={acaoDesligar} noValidate>
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, margin: '4px 0 14px' }}>
            <CampoSenha rotulo="Confirme sua senha" autoComplete="current-password" autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <BotaoEnviar>Desligar mesmo assim</BotaoEnviar>
            <button className="btn btn--calmo" type="button" onClick={() => setPasso('parado')}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* ---------- desligado: o convite ---------- */
  if (passo === 'parado') {
    return (
      <section className="bloco">
        <h2>Segundo fator</h2>
        <div className="linha">
          <span className="rot">Aplicativo autenticador</span>
          <span className="val">
            <span className="selo selo--aviso">
              <i className="bi bi-shield-exclamation" aria-hidden="true" /> desligado
            </span>
          </span>
        </div>
        <p style={{ margin: '14px 0 16px', fontSize: 13.5, lineHeight: 1.7, color: 'rgba(234,241,253,.74)' }}>
          Leva dois minutos. Você precisa do <b>Google Authenticator</b> instalado no
          celular — é de graça e está nas duas lojas.
        </p>
        {erro && <div style={{ marginBottom: 14 }}><Recado tipo="erro">{erro}</Recado></div>}
        <button className="btn btn--forte btn--linha" type="button" onClick={comecar}>
          <i className="bi bi-shield-plus" aria-hidden="true" /> Ligar o segundo fator
        </button>
      </section>
    );
  }

  /* ---------- lendo o QR ---------- */
  return (
    <section className="bloco">
      <h2>Ligar o segundo fator</h2>

      <ol className="passos-2fa">
        <li>Abra o <b>Google Authenticator</b> no celular.</li>
        <li>Toque em <b>+</b> e escolha <b>Ler código QR</b>.</li>
        <li>Aponte a câmera para a figura abaixo.</li>
        <li>Digite aqui o número de 6 dígitos que aparecer.</li>
      </ol>

      <div className="caixa-qr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr!.qr} alt="Código QR para o aplicativo autenticador" width={220} height={220} />
        <div>
          <p>Sem câmera? Digite este código no aplicativo:</p>
          <code>{qr!.legivel}</code>
        </div>
      </div>

      {estadoLigar?.erro && <Recado tipo="erro">{estadoLigar.erro}</Recado>}

      <form action={acaoLigar} noValidate>
        <input type="hidden" name="segredo" value={qr!.segredo} />
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, margin: '10px 0 14px' }}>
          <div className="campo">
            <label htmlFor="cod2fa">Código do aplicativo</label>
            <input
              id="cod2fa" name="codigo" type="text" inputMode="numeric"
              autoComplete="one-time-code" placeholder="000000" maxLength={6}
              required autoFocus className="codigo-grande"
            />
            <span className="dica">
              O número muda a cada 30 segundos. Digite o que estiver na tela agora.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BotaoEnviar icone="bi-check-lg">Confirmar e ligar</BotaoEnviar>
          <button className="btn btn--calmo" type="button" onClick={() => setPasso('parado')}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------- os dez códigos, mostrados UMA vez ---------- */
function ListaDeCodigos({ codigos }: { codigos: string[] }) {
  return (
    <section className="bloco" style={{ borderColor: 'rgba(255,198,92,.35)' }}>
      <h2>Seus códigos de reserva</h2>
      <Recado tipo="aviso">
        <b>Guarde agora.</b> Eles não aparecem de novo — nem para nós, que guardamos
        só o hash. Cada um vale uma vez, e servem para entrar se você perder o celular.
      </Recado>

      <ul className="lista-reserva">
        {codigos.map((c) => <li key={c}>{c}</li>)}
      </ul>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          className="btn btn--calmo btn--linha"
          type="button"
          onClick={() => navigator.clipboard.writeText(codigos.join('\n'))}
        >
          <i className="bi bi-clipboard" aria-hidden="true" /> Copiar todos
        </button>
        <button className="btn btn--calmo btn--linha" type="button" onClick={() => window.print()}>
          <i className="bi bi-printer" aria-hidden="true" /> Imprimir
        </button>
      </div>

      <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.7, color: 'rgba(234,241,253,.55)' }}>
        Onde guardar: numa gaveta, num papel na carteira, ou no gerenciador de senhas.
        Não no mesmo celular do aplicativo — se ele sumir, some tudo junto.
      </p>
    </section>
  );
}

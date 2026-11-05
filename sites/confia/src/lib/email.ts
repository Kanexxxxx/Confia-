/* =============================================================
   confiia.com.br — E-MAIL

   Todo e-mail do sistema sai daqui. Um lugar só, para que o
   visual, o tom e o registro sejam sempre os mesmos.

   O QUE É REGISTRADO:
   Cada envio grava uma linha em `emails` — para quem, qual modelo,
   se saiu. Quando alguém disser "não recebi", a resposta está no
   banco em vez de na memória de alguém.

   O TOM DOS TEXTOS:
   A pessoa que recebe pode estar assustada, com pressa, ou ser
   idosa. Então: frase curta, sem termo técnico, e o motivo do
   e-mail na primeira linha. Nada de "prezado usuário".

   IRONIA QUE IMPORTA:
   Nós somos um serviço antigolpe. Nosso e-mail não pode PARECER
   golpe. Por isso: nunca pedimos senha por e-mail, sempre dizemos
   o prazo do link, e sempre explicamos o que fazer se não foi a
   pessoa que pediu. Isso está escrito em todos os modelos.

   CUIDADO AO MEXER:
     - Sem RESEND_API_KEY nada é enviado, mas o sistema não quebra:
       registra a falha e segue. Em desenvolvimento o link aparece
       no terminal para você conseguir testar.
   ============================================================= */

import 'server-only';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { env, ligado, emProducao } from '@/lib/env';

type Modelo = 'verificar_email' | 'trocar_senha' | 'senha_trocada' | 'boas_vindas';

type Envio = {
  para: string;
  contaId?: string | null;
  modelo: Modelo;
  assunto: string;
  titulo: string;
  corpo: string[];        // parágrafos
  botao?: { texto: string; url: string };
  aviso?: string;         // o "se não foi você"
  prazo?: string;
};

/* ------------------------------------------------------------------
   O visual. Tabela e estilo em linha porque cliente de e-mail em
   2026 ainda ignora CSS externo e metade ignora flexbox.
   ------------------------------------------------------------------ */
function montaHtml(e: Envio): string {
  const navy = '#0b2443';
  const paragrafos = e.corpo
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#41597a">${p}</p>`,
    )
    .join('');

  const botao = e.botao
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0">
         <tr><td style="border-radius:12px;background:${navy}">
           <a href="${e.botao.url}"
              style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:600;
                     color:#ffffff;text-decoration:none;border-radius:12px">
             ${e.botao.texto}
           </a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px;font-size:12.5px;line-height:1.7;color:#62738b">
         Se o botão não funcionar, copie e cole este endereço no navegador:<br>
         <span style="color:#41597a;word-break:break-all">${e.botao.url}</span>
       </p>`
    : '';

  const prazo = e.prazo
    ? `<p style="margin:0 0 16px;font-size:13.5px;line-height:1.7;color:#62738b">
         <b style="color:#41597a">Este link vale por ${e.prazo}.</b> Depois disso ele para
         de funcionar e você precisa pedir outro.
       </p>`
    : '';

  const aviso = e.aviso
    ? `<div style="margin:24px 0 0;padding:16px 18px;border-radius:12px;
                   background:#fff6e0;border:1px solid #f0d68a">
         <p style="margin:0;font-size:13.5px;line-height:1.7;color:#6b5a10">${e.aviso}</p>
       </div>`
    : '';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e.assunto}</title></head>
<body style="margin:0;padding:0;background:#f5f8fd">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e.titulo}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fd">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

    <tr><td style="padding:26px 32px;background:${navy}">
      <span style="font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-.02em">confia?</span>
    </td></tr>

    <tr><td style="padding:32px">
      <h1 style="margin:0 0 18px;font-size:20px;font-weight:600;color:${navy};line-height:1.35">
        ${e.titulo}
      </h1>
      ${paragrafos}
      ${botao}
      ${prazo}
      ${aviso}
    </td></tr>

    <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f2;background:#f9fbfe">
      <p style="margin:0 0 8px;font-size:12px;line-height:1.65;color:#62738b">
        <b style="color:#41597a">O confia? nunca pede sua senha por e-mail</b>, nem por
        telefone, nem por mensagem. Se alguém pedir dizendo que é da gente, é golpe.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.65;color:#8a9ab3">
        confiia.com.br &nbsp;·&nbsp; Este e-mail foi enviado para ${e.para}
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function montaTexto(e: Envio): string {
  return [
    e.titulo,
    '',
    ...e.corpo.map((p) => p.replace(/<[^>]+>/g, '')),
    e.botao ? '\n' + e.botao.texto + ':\n' + e.botao.url : '',
    e.prazo ? '\nEste link vale por ' + e.prazo + '.' : '',
    e.aviso ? '\n' + e.aviso.replace(/<[^>]+>/g, '') : '',
    '\n---',
    'O confia? nunca pede sua senha por e-mail. Se alguém pedir, é golpe.',
    'confiia.com.br',
  ].join('\n');
}

/* ------------------------------------------------------------------
   O envio
   ------------------------------------------------------------------ */
async function envia(e: Envio): Promise<boolean> {
  const html = montaHtml(e);
  const texto = montaTexto(e);

  if (!ligado.email) {
    /* Sem chave configurada. Em desenvolvimento, o link no terminal
       permite testar o fluxo inteiro sem depender de e-mail. */
    if (!emProducao) {
      console.log('\n────────── E-MAIL (não enviado: falta RESEND_API_KEY) ──────────');
      console.log('para:', e.para, '| assunto:', e.assunto);
      if (e.botao) console.log('LINK:', e.botao.url);
      console.log('────────────────────────────────────────────────────────────────\n');
    }
    await registra(e, 'falhou', 'RESEND_API_KEY ausente');
    return false;
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_REMETENTE,
        to: [e.para],
        ...(env.EMAIL_RESPOSTA ? { reply_to: env.EMAIL_RESPOSTA } : {}),
        subject: e.assunto,
        html,
        text: texto,
      }),
    });

    const corpo = (await r.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!r.ok) {
      await registra(e, 'falhou', corpo.message || `HTTP ${r.status}`);
      console.error('[email] não enviou:', e.modelo, corpo.message || r.status);
      return false;
    }

    await registra(e, 'enviado', null, corpo.id);
    return true;
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    await registra(e, 'falhou', msg);
    console.error('[email] erro de rede:', msg);
    return false;
  }
}

async function registra(e: Envio, status: string, erro: string | null, resendId?: string) {
  try {
    await db.insert(emails).values({
      contaId: e.contaId ?? null,
      destino: e.para,
      modelo: e.modelo,
      resendId: resendId ?? null,
      status,
      erro,
    });
  } catch (x) {
    console.error('[email] não registrou o envio:', x);
  }
}

/* ------------------------------------------------------------------
   OS MODELOS
   ------------------------------------------------------------------ */

export function mandaVerificarEmail(p: {
  para: string; contaId: string; nome: string; url: string;
}) {
  return envia({
    para: p.para, contaId: p.contaId, modelo: 'verificar_email',
    assunto: 'Confirme seu e-mail no confia?',
    titulo: `Oi, ${primeiroNome(p.nome)}. Falta um clique.`,
    corpo: [
      'Sua conta no confia? foi criada. Para começar a usar, confirme que este e-mail é seu.',
      'É só clicar no botão abaixo.',
    ],
    botao: { texto: 'Confirmar meu e-mail', url: p.url },
    prazo: '2 dias',
    aviso:
      '<b>Não foi você que criou esta conta?</b> Então alguém digitou seu e-mail por engano — ' +
      'ou de propósito. Ignore esta mensagem: sem a confirmação, a conta não é ativada e ' +
      'nada acontece.',
  });
}

export function mandaTrocarSenha(p: {
  para: string; contaId: string; nome: string; url: string;
}) {
  return envia({
    para: p.para, contaId: p.contaId, modelo: 'trocar_senha',
    assunto: 'Criar uma nova senha no confia?',
    titulo: `Oi, ${primeiroNome(p.nome)}. Vamos criar uma senha nova.`,
    corpo: [
      'Recebemos um pedido para trocar a senha da sua conta no confia?.',
      'Clique no botão para escolher a nova. Sua senha atual continua valendo até você terminar.',
    ],
    botao: { texto: 'Criar nova senha', url: p.url },
    prazo: '1 hora',
    aviso:
      '<b>Não foi você que pediu?</b> Não precisa fazer nada — sua senha continua a mesma e ' +
      'este link expira sozinho. Mas se isso se repetir, escreva para a gente: ' +
      'pode ser alguém tentando entrar na sua conta.',
  });
}

export function mandaSenhaTrocada(p: { para: string; contaId: string; nome: string }) {
  return envia({
    para: p.para, contaId: p.contaId, modelo: 'senha_trocada',
    assunto: 'Sua senha do confia? foi trocada',
    titulo: 'Sua senha foi trocada',
    corpo: [
      `Oi, ${primeiroNome(p.nome)}. A senha da sua conta no confia? acabou de ser alterada.`,
      'Por segurança, todos os aparelhos que estavam conectados foram desconectados. ' +
      'Você vai precisar entrar de novo em cada um.',
    ],
    aviso:
      '<b>Não foi você?</b> Então alguém entrou na sua conta. Peça uma nova senha agora ' +
      'mesmo em confiia.com.br/esqueci-senha e escreva para suporte@confiia.com.br.',
  });
}

export function mandaBoasVindas(p: { para: string; contaId: string; nome: string }) {
  return envia({
    para: p.para, contaId: p.contaId, modelo: 'boas_vindas',
    assunto: 'Bem-vindo ao confia?',
    titulo: `Pronto, ${primeiroNome(p.nome)}. Sua conta está ativa.`,
    corpo: [
      'Agora é só colar um link, um @ ou um print quando bater aquela dúvida — e a gente ' +
      'diz o que encontrou, com o motivo de cada conclusão.',
      'Uma coisa que vale saber desde já: <b>a gente nunca vai pedir sua senha</b>, ' +
      'nem por e-mail, nem por telefone. Se pedirem, é golpe se passando pela gente.',
    ],
    botao: { texto: 'Fazer minha primeira verificação', url: 'https://confiia.com.br' },
  });
}

function primeiroNome(nome: string) {
  return (nome || '').trim().split(/\s+/)[0] || 'tudo bem';
}

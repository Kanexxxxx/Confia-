'use server';

/* =============================================================
   confiia.com.br — cadastrar uma loja

   ─────────────────────────────────────────────────────────────
   O QUE ESTE CADASTRO PROMETE, E O QUE ELE NÃO PROMETE

   Ele registra o pedido. Não aprova nada.

   A empresa nasce com status 'em_analise' e nível 'registrada'.
   O selo que o cliente vê — 'verificada' — só vem depois de a
   pessoa PROVAR que o site é dela, e essa prova é um passo
   próprio, não uma caixa marcada num formulário.

   A tentação aqui seria aprovar na hora para a tela parecer
   mágica. Num serviço cujo produto é confiança, um selo dado sem
   conferência não vale nada — e o primeiro golpista que
   descobrisse isso cadastraria a loja falsa dele.
   ─────────────────────────────────────────────────────────────
   O CNPJ É CONFERIDO EM DOIS TEMPOS

   AGORA: os dígitos verificadores, aqui mesmo. Isso pega erro de
   digitação e número inventado ao acaso, e custa zero.

   DEPOIS: a situação na Receita Federal, na análise. É o que diz
   se a empresa existe e está ativa — e depende de uma consulta
   externa que ainda não está ligada.

   A tela diz exatamente isso. Não escrevemos "conferido na
   Receita" antes de ter conferido na Receita.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - O CNPJ tem índice ÚNICO no banco. Cadastro repetido é
       rejeitado lá; aqui a gente devolve uma mensagem que
       explica, em vez de deixar o erro do Postgres subir.
     - `empresa_dominios` guarda cada endereço (site, Instagram,
       WhatsApp) numa linha. É por ali que a posse é provada
       depois, um por um.
   ============================================================= */

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { empresas, empresaDominios } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { confereLimite, ipDeQuemChama } from '@/lib/limite';
import { registra } from '@/lib/auditoria';
import { cnpjValido, soNumeros } from '@/lib/documento';
import { pareceRobo } from '@/lib/armadilha';

export type EstadoLoja = {
  erro?: string;
  campo?: 'cnpj' | 'fantasia' | 'categoria' | 'categoria_outro' | 'site' | 'email' | 'aceite' | 'geral';
  ok?: string;
  protocolo?: string;
  precisaProvar?: boolean;
} | null;

const CATEGORIAS = new Set([
  'moda', 'eletronicos', 'casa', 'alimentacao',
  'servicos', 'automotivo', 'saude', 'outro',
]);

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function geraProtocolo() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return 'L-' + [...b].map((x) => ALFABETO[x % ALFABETO.length]).join('');
}

/* "https://Minha Loja.com.br/" → "minhaloja.com.br"
   O domínio é a chave de tudo aqui: é ele que a pessoa vai
   provar que é dela e é ele que casa com o que o visitante cola
   no verificador. Precisa entrar sempre no mesmo formato. */
function limpaDominio(bruto: string): string {
  return bruto
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/\s+/g, '');
}

const DOMINIO_VALIDO = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export async function cadastrarLoja(
  _anterior: EstadoLoja,
  form: FormData,
): Promise<EstadoLoja> {
  const cnpj = soNumeros(String(form.get('cnpj') ?? ''));
  const fantasia = String(form.get('fantasia') ?? '').trim();
  const categoria = String(form.get('categoria') ?? '').trim();
  /* Perguntado desde sempre, gravado desde a migração 017. Antes,
     escolher "Outro" gravava a palavra "outro" e nada mais. */
  const categoriaOutro = String(form.get('categoria_outro') ?? '').trim();
  const siteBruto = String(form.get('site') ?? '').trim();
  const instagram = String(form.get('instagram') ?? '').trim().replace(/^@/, '');
  const whatsapp = soNumeros(String(form.get('whatsapp') ?? ''));
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const aceite = form.get('aceite') === 'on';

  /* ---------- CNPJ ---------- */
  if (cnpj.length !== 14) {
    return { erro: 'O CNPJ tem 14 números. Confira o que você digitou.', campo: 'cnpj' };
  }
  if (!cnpjValido(cnpj)) {
    /* Dígito verificador errado. Quase sempre é digitação —
       por isso a mensagem sugere conferir, não acusa. */
    return {
      erro: 'Esse CNPJ não passa na conferência dos dígitos. Confira número por número.',
      campo: 'cnpj',
    };
  }

  /* ---------- nome e categoria ---------- */
  if (fantasia.length < 2) {
    return { erro: 'Diga o nome pelo qual as pessoas conhecem a loja.', campo: 'fantasia' };
  }
  if (fantasia.length > 120) {
    return { erro: 'Esse nome está longo demais.', campo: 'fantasia' };
  }
  if (!CATEGORIAS.has(categoria)) {
    return { erro: 'Escolha o que a loja faz.', campo: 'categoria' };
  }
  if (categoria === 'outro' && (categoriaOutro.length < 3 || categoriaOutro.length > 80)) {
    return { erro: 'Escreva em poucas palavras o que a loja vende ou faz.', campo: 'categoria_outro' };
  }

  /* ---------- site ---------- */
  const site = limpaDominio(siteBruto);
  if (!site) {
    return { erro: 'Diga o endereço do site da loja.', campo: 'site' };
  }
  if (!DOMINIO_VALIDO.test(site)) {
    return {
      erro: 'Esse endereço não parece um site. Exemplo: minhaloja.com.br',
      campo: 'site',
    };
  }

  /* ---------- e-mail ---------- */
  if (!EMAIL_VALIDO.test(email)) {
    return { erro: 'Digite um e-mail de contato válido.', campo: 'email' };
  }

  if (!aceite) {
    return {
      erro: 'Marque a declaração para continuar — ela é o que responsabiliza quem cadastra.',
      campo: 'aceite',
    };
  }

  /* ---------- armadilha para robô ----------
     Ver lib/armadilha.ts. A resposta é um SUCESSO FALSO de
     propósito: dizer "você caiu na armadilha" ensinaria o autor
     do script a consertá-lo. Nada é gravado. */
  if (pareceRobo(form)) {
    return { ok: 'Cadastro recebido.', protocolo: 'L-XXXXXXXX' };
  }

  const limite = await confereLimite('loja');
  if (!limite.pode) return { erro: limite.recado, campo: 'geral' };

  /* E-MAIL DO PRÓPRIO DOMÍNIO JÁ É MEIA PROVA.
     Quem consegue receber em contato@minhaloja.com.br controla o
     domínio — é o mesmo raciocínio que o mundo inteiro usa para
     recuperar senha. Ainda assim exige confirmar o e-mail; o que
     ele dispensa é o passo de mexer no DNS. */
  const dominioDoEmail = email.split('@')[1] ?? '';
  const emailDoDominio = dominioDoEmail === site || dominioDoEmail.endsWith('.' + site);

  /* ---------- CNPJ REPETIDO ----------
     O índice único do banco é quem GARANTE que não haja duas
     empresas com o mesmo CNPJ. Esta consulta não substitui a
     garantia — ela existe para a mensagem.

     Por que não confiar só no erro do banco: dentro de uma
     transação o Drizzle embrulha a exceção e o código `23505` do
     Postgres não chega até aqui. Sem esta consulta, um CNPJ
     repetido devolvia "erro interno", que não diz nada a quem
     está tentando cadastrar a própria loja.

     Existe uma corrida possível — dois envios ao mesmo tempo
     passariam os dois por aqui —, e é por isso que o índice
     continua sendo a garantia. O pior caso é a segunda pessoa
     receber a mensagem genérica, e não um dado duplicado. */
  const [jaExiste] = await db
    .select({ id: empresas.id })
    .from(empresas)
    .where(eq(empresas.cnpj, cnpj))
    .limit(1);

  if (jaExiste) {
    /* Não dizemos DE QUEM é o cadastro — isso entregaria dado de
       outra empresa a quem só digitou um número. */
    return {
      erro: 'Esse CNPJ já tem cadastro aqui. Se a loja é sua, fale com a gente que a gente resolve.',
      campo: 'cnpj',
    };
  }

  const quem = await sessaoAtual();
  const protocolo = geraProtocolo();

  try {
    await db.transaction(async (tx) => {
      const [empresa] = await tx
        .insert(empresas)
        .values({
          contaId: quem?.id ?? null,
          cnpj,
          nomeFantasia: fantasia,
          categoria,
          categoriaOutro: categoria === 'outro' ? categoriaOutro : null,
          emailContato: email,
          telefoneContato: whatsapp || null,
          /* 'em_analise', nunca 'aprovada'. Ver o comentário do
             topo: selo dado sem conferência não vale nada. */
          status: 'em_analise',
          nivel: 'registrada',
          codigo: protocolo,
        })
        .returning({ id: empresas.id });

      /* Cada endereço numa linha. A posse é provada um por um. */
      const enderecos: { tipo: 'site' | 'instagram' | 'whatsapp'; valor: string; principal: boolean }[] = [
        { tipo: 'site', valor: site, principal: true },
      ];
      if (instagram) enderecos.push({ tipo: 'instagram', valor: instagram, principal: false });
      if (whatsapp) enderecos.push({ tipo: 'whatsapp', valor: whatsapp, principal: false });

      await tx.insert(empresaDominios).values(
        enderecos.map((e) => ({
          empresaId: empresa.id,
          tipo: e.tipo,
          valor: e.valor,
          principal: e.principal,
          metodo: e.tipo === 'site' && emailDoDominio
            ? ('email_do_dominio' as const)
            : null,
        })),
      );
    });
  } catch (e) {
    /* CONFERE O CÓDIGO, NÃO O TEXTO.

       `23505` é `unique_violation` no padrão do Postgres. O texto
       da mensagem depende do idioma do servidor e do nome da
       restrição — os dois podem mudar sem aviso, e aí a condição
       para de casar em silêncio e a pessoa passa a receber "erro
       interno" no lugar da explicação. Foi o que aconteceu aqui:
       eu conferia o texto e o erro vinha embrulhado pela
       transação.

       O código é estável e é o que o Postgres promete. */
    const codigo =
      typeof e === 'object' && e !== null && 'code' in e
        ? String((e as { code?: unknown }).code)
        : '';

    /* Não dizemos de QUEM é o cadastro que já existe — isso seria
       entregar dado de outra empresa a quem só digitou um CNPJ. */
    if (codigo === '23505') {
      return {
        erro: 'Esse CNPJ já tem cadastro aqui. Se a loja é sua, fale com a gente que a gente resolve.',
        campo: 'cnpj',
      };
    }
    console.error('[loja] falhou ao gravar:', e);
    return {
      erro: 'Não conseguimos registrar agora. Tente de novo em alguns minutos.',
      campo: 'geral',
    };
  }

  /* O IP ENTRA AQUI, E NÃO É DETALHE

     Este cadastro era a única ação do projeto que gravava
     auditoria SEM o IP — todas as de conta e de segurança já
     mandavam (`acoes-conta.ts`, `acoes-seguranca.ts`).

     Faz diferença justamente nesta: o risco desta tela é alguém
     cadastrar empresa que não é dele. Quando isso acontecer, o
     que responde "quem foi" é esta linha. Sem ela, sobra só o
     protocolo — que diz o QUE foi cadastrado e não POR QUEM.

     SE VOCÊ MEXER AQUI, MEXA ALI TAMBÉM: a tela diz à pessoa,
     na declaração (`registrar-loja/forma.tsx`), que o envio fica
     registrado com data, hora e endereço. Tirando o IP daqui,
     aquela frase vira promessa falsa — e num site que existe
     para apontar promessa falsa, isso é pior que o buraco.

     Prazo e base legal já estão na Política de Privacidade:
     registro de acesso, 6 meses, Marco Civil art. 15. */
  await registra({
    ator: quem?.id ?? null,
    acao: 'empresa.cadastrar',
    alvoTipo: 'empresa',
    alvoId: protocolo,
    depois: { categoria, temInstagram: Boolean(instagram), emailDoDominio },
    ip: await ipDeQuemChama(),
  });

  return {
    ok: 'Cadastro recebido.',
    protocolo,
    precisaProvar: !emailDoDominio,
  };
}

'use server';

/* =============================================================
   confiia.com.br — receber uma denúncia

   ─────────────────────────────────────────────────────────────
   QUEM DENUNCIA NÃO PRECISA TER CONTA

   Alguém que acabou de perder dinheiro não vai criar cadastro
   para avisar. Exigir conta aqui custaria denúncias — e denúncia
   perdida é a próxima pessoa caindo no mesmo golpe.

   Por isso `contaId` é opcional: se houver sessão, a denúncia
   fica ligada à conta; se não, entra anônima e funciona igual.
   ─────────────────────────────────────────────────────────────
   O LIMITE DE ENVIO É PROTEÇÃO DA BASE, NÃO BUROCRACIA

   Um formulário público que grava no banco é um convite para
   encher a base de lixo — ou, pior, para derrubar a nota de um
   concorrente honesto mandando cem denúncias. O limite por IP é
   o que torna isso caro o bastante para não valer a pena.
   ─────────────────────────────────────────────────────────────

   CUIDADO AO MEXER:
     - O `alvo` é o dado que vai ficar MARCADO na base. Ele passa
       por limpeza e limite de tamanho: é texto de estranho indo
       para uma coluna que outras pessoas vão ler.
     - `email_aviso` é dado pessoal de quem denunciou. Não pode
       vazar para nenhuma consulta pública — nem para o retorno
       desta função.
     - A denúncia nasce com status 'nova'. Nada aparece no site
       antes de passar pela moderação.
   ============================================================= */

import { db } from '@/db';
import { denuncias } from '@/db/schema';
import { sessaoAtual } from '@/lib/sessao';
import { confereLimite } from '@/lib/limite';
import { registra } from '@/lib/auditoria';
import { pareceRobo } from '@/lib/armadilha';

export type EstadoDenuncia = {
  erro?: string;
  campo?: 'categoria' | 'categoria_outro' | 'alvo' | 'relato' | 'email' | 'apelido' | 'geral';
  ok?: string;
  protocolo?: string;
} | null;

/* As mesmas nove da tela. Categoria fora desta lista significa
   formulário adulterado, não erro de digitação. */
const CATEGORIAS = new Set([
  'loja', 'jogo', 'emprestimo', 'emprego', 'premio',
  'investimento', 'perfil', 'ligacao', 'outro',
]);

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* "R$ 1.234,56" → 123456 centavos.
   Em centavos, e não em reais com vírgula: dinheiro em ponto
   flutuante acumula erro, e somar prejuízo de mil denúncias com
   erro em cada uma dá um número que não bate com nada. */
function paraCentavos(bruto: string): number | null {
  const limpo = bruto.replace(/[^\d,.-]/g, '').trim();
  if (!limpo) return null;
  /* pt-BR: ponto separa milhar, vírgula separa centavos */
  const normal = limpo.replace(/\./g, '').replace(',', '.');
  const n = Number(normal);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/* Protocolo curto para a pessoa acompanhar. Sem 0/O e 1/I, que
   são os que a pessoa erra ao ler em voz alta ou copiar. */
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function geraProtocolo() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return 'D-' + [...b].map((x) => ALFABETO[x % ALFABETO.length]).join('');
}

export async function enviarDenuncia(
  _anterior: EstadoDenuncia,
  form: FormData,
): Promise<EstadoDenuncia> {
  const categoria = String(form.get('categoria') ?? '').trim();
  const alvo = String(form.get('alvo') ?? '').trim();
  const relato = String(form.get('relato') ?? '').trim();
  const sePassou = String(form.get('se_passou') ?? '').trim();
  const quando = String(form.get('quando') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const visibilidade = String(form.get('visibilidade') ?? 'anonima').trim();
  const golpeNovo = form.get('golpe_novo') === 'on';
  const descricaoNovo = String(form.get('descricao_novo') ?? '').trim();
  /* Os dois campos que a tela perguntava e o servidor jogava fora
     antes da migração 017. Ver o comentário na validação abaixo. */
  const categoriaOutro = String(form.get('categoria_outro') ?? '').trim();
  const apelido = String(form.get('apelido') ?? '').trim();

  /* ---------- o que a tela já exige, conferido de novo aqui ----------
     A validação do navegador é conveniência. Esta é a que vale:
     um formulário pode ser enviado sem navegador nenhum. */
  if (!CATEGORIAS.has(categoria)) {
    return { erro: 'Escolha um tipo de golpe para continuar.', campo: 'categoria' };
  }
  if (alvo.length < 3) {
    return { erro: 'Precisamos do link, do perfil ou do telefone.', campo: 'alvo' };
  }
  if (alvo.length > 500) {
    return { erro: 'Esse endereço está longo demais. Cole só o link.', campo: 'alvo' };
  }
  if (relato.length < 30) {
    return {
      erro: 'Conte um pouco mais: pelo menos algumas linhas sobre o que aconteceu.',
      campo: 'relato',
    };
  }
  if (relato.length > 5000) {
    return { erro: 'O relato passou de 5.000 letras. Resuma um pouco.', campo: 'relato' };
  }
  if (email && !EMAIL_VALIDO.test(email)) {
    return { erro: 'Esse e-mail não parece certo. Confira ou deixe em branco.', campo: 'email' };
  }
  if (visibilidade !== 'anonima' && visibilidade !== 'apelido') {
    return { erro: 'Escolha como a denúncia aparece.', campo: 'geral' };
  }

  /* ---------- duas perguntas que eram feitas e ignoradas ----------

     "Com apelido" aparecia na lista e não abria campo nenhum: a
     pessoa pedia para aparecer com apelido e nunca era perguntado
     qual. A denúncia saía anônima do mesmo jeito.

     "Outro" gravava a palavra "outro" e mais nada — justamente a
     denúncia mais valiosa, a que não cabe em nenhuma gaveta que a
     gente já conhece, era a que chegava vazia.

     Nenhuma das duas dava erro: o formulário dizia "recebido" e a
     resposta era descartada no caminho. */
  if (visibilidade === 'apelido' && (apelido.length < 2 || apelido.length > 60)) {
    return {
      erro: 'Escreva o apelido que você quer que apareça — ou escolha anônima.',
      campo: 'apelido',
    };
  }
  if (categoria === 'outro' && (categoriaOutro.length < 3 || categoriaOutro.length > 80)) {
    return {
      erro: 'Em poucas palavras, que tipo de golpe foi?',
      campo: 'categoria_outro',
    };
  }

  /* ---------- data ----------
     O banco recusa data futura, mas devolver a mensagem aqui é
     melhor do que deixar o erro do Postgres subir como falha. */
  let ocorridoEm: string | null = null;
  if (quando) {
    const d = new Date(quando + 'T00:00:00');
    if (Number.isNaN(d.getTime())) {
      return { erro: 'Essa data não parece certa.', campo: 'geral' };
    }
    if (d > new Date()) {
      return { erro: 'A data é no futuro. Confira o dia.', campo: 'geral' };
    }
    ocorridoEm = quando;
  }

  /* ---------- limite ----------
     Ver o comentário longo no topo: sem isto, derrubar a nota de
     um concorrente honesto custa cem cliques. */
  /* ---------- armadilha para robô ----------
     Ver lib/armadilha.ts. A resposta é um SUCESSO FALSO de
     propósito: dizer "você caiu na armadilha" ensinaria o autor
     do script a consertá-lo. Nada é gravado. */
  if (pareceRobo(form)) {
    return { ok: 'Denúncia registrada.', protocolo: 'D-XXXXXXXX' };
  }

  const limite = await confereLimite('denuncia');
  if (!limite.pode) {
    return { erro: limite.recado, campo: 'geral' };
  }

  const quem = await sessaoAtual();
  const protocolo = geraProtocolo();

  try {
    await db.insert(denuncias).values({
      contaId: quem?.id ?? null,
      alvo,
      categoria,
      categoriaOutro: categoria === 'outro' ? categoriaOutro : null,
      relato,
      sePassou: sePassou || null,
      ocorridoEm,
      emailAviso: email || null,
      visibilidade,
      /* null quando é anônima: o banco recusa apelido sem a
         visibilidade que o pede (constraint da migração 017). */
      apelido: visibilidade === 'apelido' ? apelido : null,
      prejuizoCent: paraCentavos(String(form.get('prejuizo') ?? '')),
      golpeNovo,
      descricaoNovo: golpeNovo ? (descricaoNovo || null) : null,
      codigo: protocolo,
    });
  } catch (e) {
    console.error('[denuncia] falhou ao gravar:', e);
    return {
      erro: 'Não conseguimos registrar agora. Tente de novo em alguns minutos.',
      campo: 'geral',
    };
  }

  await registra({
    ator: quem?.id ?? null,
    acao: 'denuncia.receber',
    alvoTipo: 'denuncia',
    alvoId: protocolo,
    /* Nem o alvo nem o relato vão para a auditoria: eles já estão
       na própria tabela de denúncias. Duplicar texto de vítima em
       dois lugares é dobrar a superfície de vazamento. */
    depois: { categoria, golpeNovo },
  });

  return {
    ok: 'Denúncia registrada.',
    protocolo,
  };
}

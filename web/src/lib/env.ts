/* =============================================================
   confiia.com.br — variáveis de ambiente, conferidas na partida

   POR QUE CONFERIR:
   Sem isto, uma variável esquecida vira `undefined` e o erro só
   aparece três telas depois, com mensagem que não ajuda —
   "connect ECONNREFUSED undefined:NaN" às onze da noite.
   Aqui a aplicação se recusa a subir e diz exatamente o que falta.

   REGRA DE OURO DO NEXT:
   Só variável com prefixo NEXT_PUBLIC_ vai para o navegador.
   Toda a lista abaixo é de servidor, e nenhuma delas tem esse
   prefixo — de propósito. Se um dia você precisar de algo no
   navegador, crie a variável separada, e NUNCA prefixe uma chave
   de API: o prefixo publica o segredo dentro do JavaScript que
   qualquer visitante baixa.

   CUIDADO AO MEXER:
     - Ao acrescentar variável obrigatória, atualize `.env.exemplo`
       na mesma hora, senão o próximo deploy quebra na subida.
   ============================================================= */

import { z } from 'zod';

const forma = z.object({
  /* ---------- banco ---------- */
  DATABASE_URL: z
    .string()
    .min(1, 'está vazia')
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'precisa começar com postgres://',
    }),

  /* ---------- aplicação ---------- */
  APP_URL: z.string().min(1).default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /* ---------- serviços externos ----------
     Opcionais por enquanto: o projeto sobe sem eles, e cada
     funcionalidade avisa que está desligada em vez de quebrar.
     Viram obrigatórias nas Etapas 4, 8 e 9 do PLANO.md. */
  RESEND_API_KEY: z.string().optional(),
  /* Quem aparece como remetente. Precisa ser um endereço do domínio
     verificado no Resend — @gmail.com seria recusado por ele e
     bloqueado pelo Google. */
  EMAIL_REMETENTE: z.string().default('confia? <naoresponda@confiia.com.br>'),
  /* Para onde vai a resposta de quem apertar "responder". Cai no
     Gmail pelo roteamento do Cloudflare. */
  EMAIL_RESPOSTA: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  HIVE_API_KEY: z.string().optional(),
  SAFEBROWSING_API_KEY: z.string().optional(),
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),

  /* ---------- painel administrativo ----------
     O endereço do painel NÃO fica escrito no código: este
     repositório é público, e caminho em repositório público não
     é caminho secreto.

     Isso não é a segurança — a segurança é a sessão + a tabela
     `admins` + o segundo fator, e quem chega sem isso recebe 404.
     O caminho difícil só evita que os robôs que varrem /admin e
     /wp-admin encham o seu log. */
  PAINEL_CAMINHO: z.string().min(8, 'use pelo menos 8 caracteres').optional(),
});

const resultado = forma.safeParse(process.env);

if (!resultado.success) {
  const problemas = resultado.error.issues
    .map((p) => `    ${p.path.join('.')}: ${p.message}`)
    .join('\n');

  /* Erro na partida, não no meio do atendimento de alguém. */
  throw new Error(
    '\n\n  Variáveis de ambiente com problema:\n\n' +
      problemas +
      '\n\n  Em desenvolvimento elas ficam em web/.env.local\n' +
      '  Em produção, em /etc/confia/ no servidor.\n' +
      '  Veja PLANO.md, Etapa 3.\n',
  );
}

export const env = resultado.data;

/** Ligamos as funcionalidades conforme a chave existe. Assim o
 *  sistema roda incompleto sem mentir sobre o que consegue fazer. */
export const ligado = {
  email: Boolean(env.RESEND_API_KEY),
  leituraDeImagem: Boolean(env.OPENAI_API_KEY),
  deteccaoDeIa: Boolean(env.HIVE_API_KEY),
  listasDePhishing: Boolean(env.SAFEBROWSING_API_KEY),
  pagamento: Boolean(env.ASAAS_API_KEY),
} as const;

export const emProducao = env.NODE_ENV === 'production';

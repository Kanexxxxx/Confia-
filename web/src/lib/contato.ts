/* =============================================================
   confiia.com.br — os dados de contato, num lugar só

   O telefone estava escrito à mão em três arquivos (Termos,
   Reembolso e agora o botão flutuante). Trocar de número
   significava caçar as três ocorrências e esquecer uma — e um
   número de contato errado num site antigolpe é justamente o
   tipo de detalhe que derruba a confiança.

   CUIDADO AO MEXER:
     - `WHATSAPP_NUMERO` é só dígitos, com o 55 do Brasil na
       frente. É o formato que o wa.me exige.
     - `WHATSAPP_VISIVEL` é o que a pessoa lê. Os dois precisam
       ser o mesmo número — não há como o código conferir isso
       por você.
     - O e-mail também aparece no rodapé e na home. Mesma regra.
   ============================================================= */

export const WHATSAPP_NUMERO = '5516997062339';
export const WHATSAPP_VISIVEL = '(16) 99706-2339';

export const EMAIL_CONTATO = 'contato@confiia.com.br';

/* A mensagem já vem escrita para a pessoa não travar no "oi".
   Quem chega aqui normalmente está com pressa e com medo. */
const PRIMEIRA_MENSAGEM = 'Oi! Vim pelo site do confia? e queria tirar uma dúvida.';

export const WHATSAPP_LINK =
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(PRIMEIRA_MENSAGEM)}`;

/* Onde a empresa fica. Aparece no rodapé e nos documentos legais.

   Sem endereço completo DE PROPÓSITO: enquanto não houver CNPJ, o
   endereço seria o residencial de uma pessoa física, e isso não vai
   para um site público.

   A cidade é Pitangueiras, no interior de São Paulo — o mesmo
   DDD 16 do telefone acima. Ela aparece no rodapé e nos documentos
   legais; mudar aqui muda em todos. */
export const CIDADE = 'Pitangueiras, SP';
export const CIDADE_LONGA = 'Pitangueiras, interior de São Paulo';
export const ANO_FUNDACAO = 2026;

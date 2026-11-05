/* =============================================================
   confiia.com.br — CNPJ

   A mesma conferência existe no banco (função `cnpj_valido` em
   010_codigo16_e_cnpj.sql). Aqui é só para a pessoa receber uma
   mensagem gentil antes de o banco recusar com erro técnico.

   Repetir a regra nos dois lugares é proposital: a do banco é a
   que VALE — formulário se contorna, banco não.

   O QUE ISTO CONFERE E O QUE NÃO CONFERE:
     confere ....... se o número é bem formado (dígitos batem)
     NÃO confere ... se a empresa existe, se está ativa, se é sua
   Isso só a Receita responde, e é o que a Etapa 8 vai consultar.
   ============================================================= */

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function soNumeros(v: string): string {
  return (v || '').replace(/\D/g, '');
}

export function cnpjValido(entrada: string): boolean {
  const n = soNumeros(entrada);
  if (n.length !== 14) return false;

  /* 11111111111111 passa na conta dos dígitos mas não existe. */
  if (/^(\d)\1{13}$/.test(n)) return false;

  const digito = (pesos: number[], ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(n[i]) * pesos[i];
    const d = 11 - (soma % 11);
    return d >= 10 ? 0 : d;
  };

  return Number(n[12]) === digito(PESOS_1, 12)
      && Number(n[13]) === digito(PESOS_2, 13);
}

/** 12.345.678/0001-90 — só aparência; o que guardamos são os números. */
export function mascaraCnpj(v: string): string {
  const n = soNumeros(v).slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

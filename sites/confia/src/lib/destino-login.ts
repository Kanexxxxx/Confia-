/** Retém caminhos relativos à origem. Barras invertidas e caracteres de
 * controle podem mudar como o navegador interpreta o cabeçalho Location. */
export function destinoLogin(destino: string): string {
  const caminhoInterno = destino.startsWith('/') && !destino.startsWith('//');
  const caracteresInseguros = Array.from(destino).some((caractere) =>
    caractere === '\\' || caractere.charCodeAt(0) < 32 || caractere.charCodeAt(0) === 127,
  );
  return caminhoInterno && !caracteresInseguros ? destino : '/conta';
}

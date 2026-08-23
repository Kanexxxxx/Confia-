'use client';

/* =============================================================
   confiia.com.br — escolher o avatar

   Grade de opções que funciona pelo teclado como um grupo de
   rádio de verdade: seta anda entre as opções, espaço escolhe.

   CUIDADO AO MEXER:
     - Cada opção precisa de nome acessível ("Avatar Onda"), senão
       quem usa leitor de tela ouve só "botão, botão, botão".
   ============================================================= */

import { useState } from 'react';
import { Avatar, AVATARES, type NomeAvatar } from './avatar';

export function EscolheAvatar({
  nome, inicial = 'inicial', campo = 'avatar',
}: {
  nome: string;
  inicial?: string;
  campo?: string;
}) {
  const [escolhido, setEscolhido] = useState<string>(inicial);

  const opcoes: { id: NomeAvatar; rotulo: string }[] = [
    { id: 'inicial', rotulo: 'Suas iniciais' },
    ...Object.entries(AVATARES).map(([id, a]) => ({
      id: id as NomeAvatar,
      rotulo: a.nome,
    })),
  ];

  return (
    <fieldset className="escolha-avatar">
      <legend>Sua figura</legend>
      <p className="dica" style={{ marginTop: -2, marginBottom: 10 }}>
        Escolha um bicho. Não tem envio de foto — sua imagem não fica guardada com a gente.
      </p>

      <div className="grade-avatar" role="radiogroup" aria-label="Escolha sua figura">
        {opcoes.map((o) => (
          <label key={o.id} title={o.rotulo}>
            <input
              type="radio"
              name={campo}
              value={o.id}
              checked={escolhido === o.id}
              onChange={() => setEscolhido(o.id)}
            />
            <span>
              <Avatar nome={nome || 'confia'} avatar={o.id} tamanho={44} />
              <span className="sr">Avatar {o.rotulo}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

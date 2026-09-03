/* =============================================================
   confiia.com.br — os dois campos invisíveis da armadilha

   Entra dentro de qualquer <form> público. Ver `lib/armadilha.ts`
   para o porquê de cada um.

   ─────────────────────────────────────────────────────────────
   ESTE COMPONENTE NÃO CALCULA NADA — E ISSO É O PONTO

   Ele recebe o carimbo pronto, por propriedade, e só desenha. A
   primeira versão chamava `carimboDeAgora()` aqui dentro, e o
   resultado foi um erro de verdade: os formulários são
   `'use client'`, então tudo que eles importam vai junto para o
   navegador. A assinatura passou a ser feita LÁ — onde
   `COFRE_CHAVE` não existe e o `createHmac` é um remendo que nem
   conhece `base64url`. A página travou na hidratação, e se não
   tivesse travado seria pior: carimbo assinado com chave pública
   é carimbo que qualquer um forja.

   Quem chama `carimboDeAgora()` é a PÁGINA, que é de servidor. O
   caminho é: página → formulário → estes campos.

   ─────────────────────────────────────────────────────────────
   POR QUE O CAMPO ISCA É ESCONDIDO ASSIM

   Não é `display:none` numa classe do CSS: robô que carrega a
   folha de estilo reconhece esse truque há anos. Ele é escondido
   no próprio elemento, e três coisas o tiram do caminho de quem
   é gente:

     `aria-hidden`        leitor de tela não anuncia
     `tabIndex={-1}`      o Tab não para nele
     `autoComplete="off"` o navegador não oferece preencher

   Sem os três, o campo pegaria quem usa leitor de tela ou
   preenchimento automático — exatamente as pessoas que este site
   existe para não atrapalhar.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - NÃO importe nada de `lib/armadilha.ts` aqui. Aquele arquivo
       é `server-only` e o build quebra — de propósito.
     - O nome `website` é escolhido para ser atraente para robô e
       inútil para nós. Trocar por algo genérico como `campo2`
       reduz a chance de o robô morder.
   ============================================================= */

export function CamposArmadilha({ carimbo }: { carimbo: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
      }}
    >
      <label htmlFor="website">Não preencha este campo</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
      <input type="hidden" name="carimbo" defaultValue={carimbo} />
    </div>
  );
}

# Roteiro do Confia

A ordem sai da auditoria de 4 de novembro de 2026
(`docs/AUDITORIA.md`). Cada fase termina com algo que se vê no
navegador, no celular e no computador. Nada aqui autoriza deploy:
subir o site continua sendo a última coisa, como está em `CLAUDE.md`.

O domínio `vaideconfia.com` hoje serve o protótipo estático. O
Next deste repositório é outro produto, mais à frente e ainda
incompleto. O roteiro abaixo é do Next. O protótipo sai do ar
público na fase 1, ou fica só como arquivo em `prototipo/`.

---

## Fase 1 — Correções críticas

O que impede usar o que já está escrito sem mentir ou sem abrir
porta.

1. Fechar o redirecionamento depois do login (A1). Teste: destino
   com `https`, com `//` e com barra invertida volta para `/conta`.
2. Parar de confiar no primeiro `X-Forwarded-For` (A2). O IP da
   sessão e do limite é o que o nginx viu na conexão.
3. CSP e página estática (A3). `/esqueci-senha` e o 404 executam
   script de novo, conferido no console.
4. Tirar `admin.html` de `vaideconfia.com` (A4). `/admin` no ar
   deixa de responder 200.
5. Painel da conta em 390 px sem rolagem horizontal (A5). As seis
   rotas de `/conta`.
6. Botão de plano deixa de dizer "Assinar" até existir cobrança
   (A6). O aviso de obra volta no mesmo dia em que o texto
   prometesse pagamento.
7. Trocar a senha da conta de teste em qualquer banco que não seja
   a máquina de quem desenvolve, e tirá-la dos arquivos versionados
   (A7).
8. 404 em português, com contraste e link para a home (M8).
9. Página de conta suspensa, e o layout de `/conta` respeitando o
   status (M1).
10. Aviso de cookies fora do verificador (M9), nas duas larguras.

Prova da fase: `tsc`, `lint`, `prova-armadilha`, `confere-banco`,
e uma passada no Chrome a 1440 e a 390 nas rotas de
`docs/auditoria/screens/`.

---

## Fase 2 — Pagamentos

O Asaas já tem cliente HTTP e script de prova. Falta o caminho
da pessoa.

1. Sandbox primeiro. Chave de produção só quando o webhook tiver
   sido visto recusar assinatura falsa.
2. Uma rota de servidor cria a cobrança. O browser nunca vê a
   chave. `chamaAsaas` continua sendo a única saída.
3. Webhook com o token em `ASAAS_WEBHOOK_TOKEN`, corpo conferido,
   idempotência por `asaas_id`. Sem isso, a pessoa paga e o plano
   não muda, ou muda duas vezes.
4. A tabela `pagamentos` e a `assinaturas` ganham o `GRANT` mínimo
   na mesma migração que o site passar a usá-las. RLS com política
   nomeada, no estilo da 015 e da 019.
5. O botão volta a poder dizer "Assinar" só nesse commit, e o
   texto deixa claro o que ainda não está incluso (verificação
   ilimitada, por exemplo, continua dependendo do motor).
6. Reembolso faz o que `reembolso/page.tsx` já promete, ou a
   página é reescrita para o que o código faz. Os dois textos não
   podem divergir.
7. `payment=()` na `Permissions-Policy` só sai se o checkout usar
   a API de pagamento do navegador. Pix hospedado no Asaas não
   precisa.

Fora desta fase: parcelamento, nota fiscal, split, e qualquer
cobrança abaixo do piso que o `ASAAS.md` já mediu.

---

## Fase 3 — Celular dedicado e PWA instalável

O site já responde em 390 px na maior parte das páginas públicas.
A conta não (fase 1). "Versão mobile" aqui não é outro domínio.
É o mesmo Next, com instalação e com as telas de uso repetido
desenhadas para o polegar.

1. `manifest.ts`: nome, ícone, `display: standalone`, cor `#0b2443`,
   `lang: pt-BR`.
2. Service worker só para o casco (HTML de entrada, logo, CSS).
   Denúncia, sessão e resultado não vão para cache. Um verificador
   de golpe com página velha é pior do que um site lento.
3. Atalho na home do celular abre direto no verificador, não num
   menu.
4. A faixa de `/conta` rola por dentro, com indício de que há mais
   itens (o menu do topo já faz isso). Alvo de toque de pelo menos
   44 px, inclusive no 2FA e no "mostrar senha".
5. O aviso de cookies, o WhatsApp e o botão de acessibilidade não
   se cobrem e não cobrem o campo de colar.
6. Banner de instalação discreto, depois que a pessoa concluiu uma
   ação (denúncia enviada ou conta criada), não na primeira pintura.

Prova: Lighthouse de PWA no celular, mais a lista de rotas da
fase 1 de novo em 390 px. Instalação conferida no Chrome de
Android. iOS instala pelo "Adicionar à Tela de Início"; o
manifesto tem que servir para os dois, sabendo que o iOS não
aceita o mesmo service worker à risca.

---

## Fase 4 — Desktop

O computador não precisa de outro site. Precisa do que a largura
já devia estar fazendo e ainda não tem conteúdo para mostrar.

1. `/conta` em 1440 px: a coluna de 268 px fica, o miolo não
   estica o texto até 900 px. Medida de linha curta nos textos
   longos.
2. Planos: os quatro cartões já cabem. O diálogo "Antes de
   assinar" precisa abrir de fato a partir do botão do cartão e
   fechar por Esc, clique fora e botão, com foco preso enquanto
   estiver aberto.
3. Admin de verdade, atrás da porta que já existe
   (`[chave]/painel`): fila, contas, empresas, custos. O desenho
   de referência é `prototipo/admin.html`, refeito em React, sem
   publicar o HTML. Cada decisão grava `auditoria` com ação
   específica, não com nome emprestado (M6).
4. Atalhos de teclado só onde já existe equivalente no mouse
   (buscar na fila, decidir o item aberto). Nada de comando que
   só quem usa teclado descobre por acidente.

O admin não entra antes da fase 1. Porta bonita sem as travas
que já estão escritas seria regressão.

---

## Fase 5 — Vidro líquido e transições

O efeito já existe: `filtros-vidro.tsx`, camadas `.lg-*`,
`revelacao.tsx`, e o comentário em `globals.css` sobre o que o
vidro consegue refratar sem textura fina no fundo. A textura de
guilhochê foi recusada. Não volta sem pedido explícito.

Nesta fase o trabalho é consertar o efeito, não acrescentar outro.

1. O vidro fica no cabeçalho e no verificador. Não se espalha
   para cartão de texto longo: já derrubou a renderização uma vez.
2. Conteúdo abaixo da dobra pode entrar ao rolar. Conteúdo que
   informa (preço, aviso de erro, "a gente pode errar") nasce
   visível. `prefers-reduced-motion` já zera a animação; isso
   permanece.
3. O cookie deixa de sentar em cima do vidro (M9).
4. Transição de rota curta, 150–200 ms, só opacidade. Sem
   deslizar a página inteira.
5. Prefixado primeiro, padrão por último, por causa do lightningcss
   (`CLAUDE.md`). `backdrop-filter` conferido no navegador, não
   só no arquivo.

Prova: gravar a home em 1440 e em 390, com movimento reduzido
ligado e desligado. O texto não pode nascer invisível para quem
pediu menos movimento, e não pode piscar entre o HTML e o
`is-ready`.

---

## Fase 6 — Integrações

Cada uma só entra com a frase que o site mostra quando a chave
não está configurada. `env.ts` já tem o modelo em `ligado`.

| Integração | Para quê | Estado |
|---|---|---|
| Motor de verificação (etapa 8 do `PLANO.md`) | Responder o que a home promete | Não existe. O botão é honesto sobre isso |
| Google Safe Browsing | Lista pública de phishing | Variável opcional, sem chamada |
| Consulta de CNPJ na Receita | Situação da loja, hoje só dígito verificador | Comentada em `acoes-loja.ts` como passo futuro |
| Leitura de print (OpenAI) e detecção de imagem sintética (Hive) | Plano Básico promete as duas | Chaves opcionais, sem chamada. Não prometer no cartão até a chamada existir |
| Resend | Confirmar e-mail e senha | Cliente pronto. Sem chave, o fluxo segue mudo |
| Asaas | Fase 2 | Cliente pronto, sem rota |
| Notícias (Agência Brasil) | `npm run noticias` alimenta `noticias_golpe` | A página abre mesmo com a tabela vazia |
| Extensão de navegador | Item do plano Básico | Não há pasta de extensão |

Ordem dentro da fase: motor de link e telefone primeiro, porque é
o motivo de a pessoa abrir o site. Print e "rosto feito por
computador" depois, junto com a revisão do texto dos planos.
CNPJ da Receita antes de qualquer selo "verificada". Extensão
por último: ela repete o motor, não o substitui.

Toda integração de terceiro é declarada na política de
privacidade no mesmo commit. O que a página de cookies lista tem
que ser o que o código grava (M4).

---

## Fora do roteiro até alguém pedir

- Trocar Inter ou Poppins.
- Foto de avatar.
- Textura de fundo.
- Deploy por iniciativa de quem está implementando.
- Mexer no DNS raiz de `confiia.com.br`.
- App nativo. A PWA da fase 3 é o passo de instalação. Loja de
  aplicativo é outro projeto.

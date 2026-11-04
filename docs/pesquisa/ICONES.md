# Ícones para o Confia

> Pesquisa de 04/11/2026. As versões vieram do `npm view` feito hoje e os links foram verificados com HTTP 200.
> **Situação atual do site:** usa **Bootstrap Icons 1.11.3** como webfont via CDN jsDelivr (`bootstrap-icons.min.css`). A webfont baixa o conjunto inteiro, depende de uma CDN de terceiro e não anima. Isso deve ser trocado.

## Comparação

| Biblioteca | Tamanho do acervo (aprox., segundo os sites) | Estilos | Licença | Pacote React (versão hoje) | Ponto forte | Ponto fraco |
|---|---|---|---|---|---|---|
| **Lucide** — https://lucide.dev | 1.500+ | Traço (stroke ajustável) | ISC | `lucide-react` 1.68.0 | Tree-shaking perfeito, padrão do shadcn/ui, ícones de segurança fortes (`shield-check`, `shield-alert`, `link-2-off`, `scan-search`, `fish` p/ phishing) | Só um estilo |
| **Phosphor** — https://phosphoricons.com | 1.500+ × 6 pesos | thin, light, regular, bold, fill, duotone | MIT | `@phosphor-icons/react` 2.1.10 | **Duotone** combina com vidro; peso por estado (regular→fill quando ativo) | Pacote grande se importar errado |
| **Tabler** — https://tabler.io/icons | 5.900+ | Outline + filled | MIT | `@tabler/icons-react` 3.50.0 | Maior acervo grátis | Visual mais "utilitário" |
| **Heroicons** — https://heroicons.com | ~300 | outline, solid, mini, micro | MIT | `@heroicons/react` 2.2.0 | Muito polido (Tailwind) | Acervo pequeno |
| **Iconoir** — https://iconoir.com | 1.600+ | Traço | MIT | `iconoir-react` 7.12.2 | Elegante, tem `shield-alert`, `password-check` | Menos adotado |
| **Solar** (via Iconify) — https://icon-sets.iconify.design/solar/ | 1.200+ × 6 estilos | linear, bold, bold-duotone, broken, line-duotone, outline | CC BY 4.0 | via `@iconify/react` | Estilo mais "premium/glass" | Exige atribuição (CC BY) |
| **Iconify** — https://iconify.design | 200.000+ (agregador) | todos | por conjunto | `@iconify/react` | Acesso a tudo, carregamento sob demanda | Depende da API Iconify se não empacotar |
| **Lordicon** (animados) — https://lordicon.com | Milhares (Lottie) | animados | Grátis com atribuição / pago | `@lordicon/react` + lottie | Animações de alta qualidade (cadeado, escudo, alerta) | Pesado (Lottie ~60 kB+); licença |
| **useAnimations** — https://useanimations.com | ~80 | animados Lottie | grátis | `react-useanimations` | Micro-animações leves prontas | Acervo pequeno, projeto parado |
| **Lucide Animated** — https://lucide-animated.com | subconjunto Lucide | animados (Motion) | MIT | copia-cola | Mesmo traço do Lucide, anima com Motion | Só alguns ícones |
| **react-icons** — https://react-icons.github.io/react-icons/ | agrega vários | — | por conjunto | `react-icons` | Prático | Mistura estilos → visual inconsistente |

## Recomendação única: **Phosphor Icons** (peso `duotone` para destaques e `regular` no resto)

**Por quê, para o Confia especificamente:**
1. O site é vidro escuro (navy + orbs). O **duotone** tem uma segunda camada a 20% de opacidade que, em cima do vidro, lembra o reflexo do "glaze". Isso é identidade visual, não um ícone genérico.
2. **Os 6 pesos dão estado sem trocar de biblioteca.** Aba ativa usa `fill`, inativa usa `regular`. Veredito usa `ShieldCheck` em `fill` com `--safe`, `Warning` com `--warn` e `ShieldWarning`/`XCircle` com `--risk`.
3. Tem tudo de que o domínio precisa: `ShieldCheck`, `ShieldWarning`, `LinkBreak`, `Fingerprint`, `Detective`, `MagnifyingGlass`, `WhatsappLogo`, `InstagramLogo`, `PixLogo`, `CreditCard`, `GameController`, `Bank`, `Briefcase` (vaga), `Gift` (prêmio), `UserSwitch` (perfil clonado), `Storefront` (loja), `SealCheck`.
4. Licença MIT sem atribuição e tree-shaking por import (`@phosphor-icons/react/dist/ssr` para SSR).
5. **Animação:** os SVGs são simples, então dá para animar com Motion (`motion.svg`) ou CSS. Isso evita Lottie e não depende de licença do Lordicon. Se quiser **um único** ícone hero animado (o escudo do veredito), use Lordicon *somente* nele, com atribuição.

**Mapeamento sugerido para o site atual:**
| Item do site | Ícone Phosphor |
|---|---|
| Loja e marketplace | `Storefront` |
| Jogos, skins e cases | `GameController` |
| Empréstimo | `HandCoins` |
| Vaga de emprego | `Briefcase` |
| Prêmio e sorteio | `Gift` |
| Perfil clonado | `UserSwitch` |
| Golpe do Pix | `PixLogo` |
| Falsa central do banco | `PhoneCall` + `Bank` |
| Clonagem de cartão | `CreditCard` |
| Pode confiar / Desconfiar / Golpe | `ShieldCheck` / `Warning` / `ShieldWarning` |
| Upload de print | `ImageSquare` / `UploadSimple` |

## Como instalar

```bash
npm i @phosphor-icons/react
```
```tsx
import { ShieldCheck, ShieldWarning } from "@phosphor-icons/react";
<ShieldCheck size={28} weight="duotone" color="var(--safe)" aria-hidden />
```
O site atual é HTML puro, sem React. Nele dá para usar **sem CDN de terceiro**: baixe os SVGs de https://phosphoricons.com e coloque inline (ou num sprite `<svg><symbol>`):
```html
<svg class="ico" aria-hidden="true"><use href="/assets/icons.svg#shield-check"></use></svg>
```
```css
.ico{width:1.5em;height:1.5em;fill:currentColor}
@media (prefers-reduced-motion:no-preference){.card:hover .ico{transform:scale(1.08) rotate(-4deg);transition:transform .2s}}
```
**Remover** o `<link>` do `bootstrap-icons` do jsDelivr. Isso economiza uma requisição bloqueante e a dependência da CDN.

**Alternativa se o código for para shadcn/ui:** Lucide (`npm i lucide-react`) mais Lucide Animated nos hovers. Não misture duas bibliotecas no mesmo produto.

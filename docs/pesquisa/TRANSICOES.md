# Transições, efeitos e microinterações para o Confia (vaideconfia.com)

> Pesquisa de 04/11/2026. São 119 itens. Cada um traz onde usar no site, por que fica bom, uma referência (link verificado com HTTP 200/3xx, lista em `links_verificados.txt`), um trecho mínimo e notas de performance.

> **Regra global de acessibilidade:** todas as animações ficam dentro de `@media (prefers-reduced-motion: no-preference)` ou são desligadas por `@media (prefers-reduced-motion: reduce)`. No Motion, use `<MotionConfig reducedMotion="user">`. No GSAP, use `gsap.matchMedia()`. Anime só `transform`, `opacity`, `clip-path` e `filter` (pequeno). Durações: microinteração de 100 a 200 ms, troca de tela de 200 a 450 ms. Use **uma única** animação de rota por sistema (regra da pasta AUREL).

## Como o Kainã pediu: duas experiências
- **Desktop (D):** hover, cursor, tilt, Lenis, ScrollTrigger com pin, dock e command palette. Vidro com refração SVG, que só funciona no Chromium e tem fallback nos outros.
- **Mobile (M):** padrão de app nativo, com tab bar inferior, bottom sheets, gestos de swipe, verificador fixo na zona do polegar, PWA instalável e Share Target. Nada de hover nem de parallax pesado, e o blur fica em 12 px ou menos.
- **Ambos (A):** View Transitions, scroll-driven CSS e feedback de formulário.

## O que aprendi da pasta de referência (`liquid_glass/`)
- **Liquid_Glass_TOP10:** 10 reimplementações próprias inspiradas em pens do FreeFrontend e do CodePen (licença MIT nos pens públicos). Técnicas: `feDisplacementMap` dentro de `backdrop-filter:url()` (só Chromium), vidro com várias `inset`-shadows (barato e universal), gooey com `feGaussianBlur` + `feColorMatrix`, borda conic com `@property` e shader WebGL. Os melhores para o Confia são o #01 (card do verificador), o #03 (dock no painel desktop), o #04 (menu mobile), o #05/#07 (tema), o #08 (só no CTA principal) e o #09 (botões).
- **CRM_PREMIUM_UI_100 (AUREL):** 100 componentes de CRM em 4 grupos de 25. Lições que valem levar: (1) uma única animação de rota, (2) skeleton no formato do layout final em vez de spinner, (3) % só com progresso real do backend, (4) amarrar o loader à Promise real (`integracao/route-loader.js`), nunca a timers. **Atenção:** o pacote é visual de CRM. O Kainã disse que o Confia NÃO deve copiar o layout do CRM, então reaproveito só técnicas (skeleton, toasts, stepper, gauge, drawer), com a identidade navy/sky do Confia.
- O site atual já tem tokens bons (`--navy-800:#0b2443`, `--sky`, `--safe/--warn/--risk`, `--ease`), além de orbs com blur(60px) em tela cheia e grain. No mobile o blur de 60 px em 3 orbs animados é caro: reduzir para 1 orb ou usar um gradiente estático.

## Stack recomendada
- **Site estático (HTML atual):** CSS nativo (View Transitions MPA, scroll-driven, `@starting-style`, Popover) + **Motion One/`motion`** vanilla (`animate`, `scroll`, `inView`) + **GSAP 3** (gratuito desde 2025, inclusive SplitText e ScrollTrigger) só na home desktop.
- **Se migrar para React/Next:** `motion` (Framer Motion), `vaul` (sheets), `sonner` (toasts), `cmdk` e `@formkit/auto-animate`.
- Links: https://motion.dev/ · https://gsap.com/docs/v3/ · https://developer.chrome.com/docs/web-platform/view-transitions


## A. Navegação e transições de página

### 1. View Transition entre páginas (MPA, cross-document)  `[Ambos]`
- **Onde:** Home → planos.html → denunciar.html (o site é multi-página HTML).
- **Por quê:** Troca de página sem 'piscar' branco, com crossfade nativo, sem framework.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition
- **Performance/reduced-motion:** Nativo do navegador; zero JS. Em navegador sem suporte apenas não anima.
```css
@view-transition{navigation:auto}
::view-transition-old(root){animation:.25s ease-out both fade-out}
::view-transition-new(root){animation:.3s ease-out both fade-in}
```

### 2. Elemento compartilhado: logo 'confia?' fixo entre páginas  `[Ambos]`
- **Onde:** Cabeçalho em todas as páginas.
- **Por quê:** A marca fica 'parada' enquanto o conteúdo troca: sensação de app.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name
- **Performance/reduced-motion:** Um nome único por página; não repetir o mesmo nome em 2 elementos.
```css
.logo{view-transition-name:brand}
```

### 3. Verificador → página de resultado com morph do campo  `[Ambos]`
- **Onde:** Ao enviar o link no #verificador, o campo vira o cabeçalho do resultado.
- **Por quê:** Conecta visualmente 'o que colei' com 'o veredito'. Reforça confiança.
- **Referência:** https://developer.chrome.com/docs/web-platform/view-transitions/same-document
- **Performance/reduced-motion:** Só transform/opacity; evitar animar width de texto longo.
```css
input.verif{view-transition-name:alvo}
.resultado h1{view-transition-name:alvo}
// JS: document.startViewTransition(()=>renderResultado())
```

### 4. Navegação 'push' estilo iOS (desliza da direita)  `[Mobile]`
- **Onde:** Mobile: abrir detalhe de verificação, Ajuda, Planos.
- **Por quê:** Imita navegação nativa; o usuário entende hierarquia (entrar/voltar).
- **Referência:** https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- **Performance/reduced-motion:** Usar types (`view-transition-type`) para inverter a direção no 'voltar'.
```css
@media (max-width:768px){
::view-transition-old(root){animation:.3s cubic-bezier(.2,.8,.2,1) both slide-out-left}
::view-transition-new(root){animation:.3s cubic-bezier(.2,.8,.2,1) both slide-in-right}}
```

### 5. Direção pelo tipo de navegação (voltar = inverte)  `[Mobile]`
- **Onde:** Botão voltar do celular.
- **Por quê:** Coerência espacial: voltar desliza para a direita.
- **Referência:** https://developer.chrome.com/blog/view-transitions-update-io24
- **Performance/reduced-motion:** Definir type no evento `pageswap`/`pagereveal` lendo navigation.activation.
```css
@view-transition{navigation:auto;types:slide}
html:active-view-transition-type(back) ::view-transition-new(root){animation-name:slide-in-left}
```

### 6. Crossfade suave (desktop)  `[Desktop]`
- **Onde:** Menu superior: Golpes, Como funciona, Planos, Ajuda.
- **Por quê:** No desktop, deslizar a tela inteira cansa; fade de 200ms é elegante.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- **Performance/reduced-motion:** Manter < 250 ms.
```css
@media (min-width:1024px){::view-transition-group(root){animation-duration:.2s}}
```

### 7. Prefetch/prerender por Speculation Rules  `[Ambos]`
- **Onde:** Links 'Planos', 'Criar conta', 'Entrar'.
- **Por quê:** A próxima página já está pronta: a transição fica instantânea.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
- **Performance/reduced-motion:** `moderate` = ao passar o mouse; não prerenderizar /sair ou ações.
```css
<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*.html"},"eagerness":"moderate"}]}</script>
```

### 8. Cortina de cristal (route loader) — pasta AUREL #001  `[Desktop]`
- **Onde:** Login → painel da conta.
- **Por quê:** Momento de 'entrar no cofre': transmite segurança. Usar UMA só animação de rota.
- **Referência:** https://freefrontend.com/css-page-transitions/
- **Performance/reduced-motion:** Vincular à Promise real (integracao/route-loader.js), nunca a timer.
```css
.cortina{position:fixed;inset:0;backdrop-filter:blur(18px);transform:scaleY(0);transform-origin:top;transition:transform .4s cubic-bezier(.16,1,.3,1)}
.cortina.on{transform:scaleY(1)}
```

### 9. Íris circular (clip-path) — AUREL #002  `[Ambos]`
- **Onde:** Abrir resultado 'É golpe' / 'Pode confiar'.
- **Por quê:** Revela a partir do botão clicado; foco no veredito.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
- **Performance/reduced-motion:** clip-path é composto pela GPU no Chrome; testar Safari.
```css
::view-transition-new(root){animation:iris .5s ease-out}
@keyframes iris{from{clip-path:circle(0 at var(--x) var(--y))}to{clip-path:circle(150% at var(--x) var(--y))}}
```

### 10. Bottom sheet arrastável (substitui modal no celular)  `[Mobile]`
- **Onde:** Detalhes do motivo do veredito, filtros, compartilhar.
- **Por quê:** Padrão nativo de iOS/Android; polegar alcança.
- **Referência:** https://vaul.emilkowal.ski/
- **Performance/reduced-motion:** Sem React: usar <dialog> + touch-action:none no puxador.
```css
import { Drawer } from 'vaul'
<Drawer.Root><Drawer.Trigger>Por quê?</Drawer.Trigger><Drawer.Portal><Drawer.Content>…</Drawer.Content></Drawer.Portal></Drawer.Root>
```

### 11. Tab bar inferior com indicador que desliza  `[Mobile]`
- **Onde:** Mobile: Verificar · Histórico · Golpes · Conta.
- **Por quê:** Navegação de app; indicador animado dá contexto.
- **Referência:** https://motion.dev/docs/react-layout-animations
- **Performance/reduced-motion:** Respeitar env(safe-area-inset-bottom).
```css
{active&&<motion.span layoutId='tab-pill' className='pill'/>}
```

### 12. Header que some ao rolar para baixo e volta ao subir  `[Mobile]`
- **Onde:** Cabeçalho do site.
- **Por quê:** Ganha tela no celular sem perder o menu.
- **Referência:** https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- **Performance/reduced-motion:** Throttle via requestAnimationFrame; sem listener por pixel.
```css
header{position:sticky;top:0;transition:transform .25s}
header.hide{transform:translateY(-100%)}
```

### 13. Header de vidro que 'condensa' com scroll (scroll-driven)  `[Desktop]`
- **Onde:** Topo do site desktop.
- **Por quê:** Começa transparente sobre o hero, vira vidro fosco ao rolar.
- **Referência:** https://scroll-driven-animations.style/
- **Performance/reduced-motion:** Sem JS. Fallback: @supports not (animation-timeline:scroll()).
```css
header{animation:glass linear both;animation-timeline:scroll();animation-range:0 120px}
@keyframes glass{to{background:rgba(7,24,44,.7);backdrop-filter:blur(14px)}}
```

### 14. Barra de progresso de leitura  `[Ambos]`
- **Onde:** Páginas de Golpes/artigos/Ajuda.
- **Por quê:** Mostra quanto falta em conteúdos longos.
- **Referência:** https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- **Performance/reduced-motion:** Só transform.
```css
.progress{position:fixed;top:0;height:3px;transform-origin:left;animation:grow linear;animation-timeline:scroll()}
@keyframes grow{from{transform:scaleX(0)}}
```

### 15. Menu mobile fluido (gooey) — Liquid_Glass_TOP10 #04  `[Mobile]`
- **Onde:** Botão de menu no celular.
- **Por quê:** Assinatura visual 'líquida' da marca.
- **Referência:** https://codepen.io/iamryanyu/pen/gbpzgqX
- **Performance/reduced-motion:** Filtro SVG custa; aplicar só no container pequeno.
```css
.menu{filter:url(#goo)}  /* feGaussianBlur + feColorMatrix */
```

### 16. Dock flutuante de vidro — TOP10 #03  `[Desktop]`
- **Onde:** Painel da conta (desktop): atalhos.
- **Por quê:** Visual Apple Liquid Glass; ícones crescem perto do cursor.
- **Referência:** https://codepen.io/lassiterda/pen/vEOpqMa
- **Performance/reduced-motion:** Não usar em mobile (sem hover).
```css
.dock a{transition:transform .2s}
.dock a:hover{transform:scale(1.35) translateY(-6px)}
```

### 17. Command palette (Ctrl+K)  `[Desktop]`
- **Onde:** Painel/admin: buscar verificação, golpe, usuário.
- **Por quê:** Poder para usuário avançado/admin.
- **Referência:** https://cmdk.paco.me/
- **Performance/reduced-motion:** Lazy-load do componente.
```css
import { Command } from 'cmdk'
<Command.Dialog open={o} onOpenChange={setO}><Command.Input/><Command.List>…</Command.List></Command.Dialog>
```

### 18. Âncoras com scroll suave + scroll-margin  `[Ambos]`
- **Onde:** Links #como, #numeros, #politicas.
- **Por quê:** O header fixo não cobre o título.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top
- **Performance/reduced-motion:** Desligar scroll-behavior:smooth em reduced-motion (o site já usa smooth).
```css
section{scroll-margin-top:88px}
```

### 19. Scroll-spy no menu (seção ativa)  `[Desktop]`
- **Onde:** Menu superior na home.
- **Por quê:** Mostra onde o usuário está.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **Performance/reduced-motion:** Um único observer.
```css
new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&mark(e.target.id)),{rootMargin:'-40% 0px -55% 0px'})
```

### 20. Pull-to-refresh no histórico  `[Mobile]`
- **Onde:** Histórico de verificações (PWA).
- **Por quê:** Gesto nativo esperado em app.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior
- **Performance/reduced-motion:** No PWA standalone o PTR nativo não existe; implementar.
```css
body{overscroll-behavior-y:contain} /* + gesto custom com pointer events */
```

### 21. Swipe para voltar / fechar  `[Mobile]`
- **Onde:** Resultado e bottom-sheets.
- **Por quê:** Gesto de app nativo.
- **Referência:** https://use-gesture.netlify.app/
- **Performance/reduced-motion:** Não conflitar com o gesto de borda do iOS (começar >24px da borda).
```css
useDrag(({movement:[mx],last})=>last&&mx>120&&history.back())
```


## B. Home / hero / storytelling

### 22. Título em linhas que sobem (mask reveal)  `[Ambos]`
- **Onde:** Hero 'Aquele link é de verdade ou é golpe?' (já existe .ln, refinar).
- **Por quê:** Tipografia cinematográfica.
- **Referência:** https://gsap.com/docs/v3/Plugins/SplitText/
- **Performance/reduced-motion:** SplitText agora gratuito; usar autoSplit para responsivo.
```css
const s=SplitText.create('h1',{type:'lines',mask:'lines'})
gsap.from(s.lines,{yPercent:100,stagger:.08,duration:.8,ease:'expo.out'})
```

### 23. Palavra-chave alternando (golpe → loja falsa → Pix → vaga)  `[Ambos]`
- **Onde:** Hero.
- **Por quê:** Mostra a amplitude do produto em 1 linha.
- **Referência:** https://motion.dev/docs/react-animate-presence
- **Performance/reduced-motion:** aria-live='off' para não spammar leitor de tela.
```css
<AnimatePresence mode='wait'><motion.span key={w} initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}/></AnimatePresence>
```

### 24. Placeholder digitando exemplos de links suspeitos  `[Ambos]`
- **Onde:** Campo do verificador.
- **Por quê:** Ensina o que colar sem texto de instrução.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- **Performance/reduced-motion:** Parar quando o campo tem foco/valor.
```css
// troca placeholder letra a letra a cada 60ms; para no focus
```

### 25. Card de vidro com refração SVG (distortion card) — TOP10 #01  `[Desktop]`
- **Onde:** Card do verificador no hero.
- **Por quê:** O 'glaze' que o Kainã quer, com refração real em vez de só blur.
- **Referência:** https://freefrontend.com/css-liquid-glass/
- **Performance/reduced-motion:** backdrop-filter:url() só funciona em Chromium; fallback blur simples no Safari/Firefox.
```css
.card{backdrop-filter:url(#refract) blur(9px)} /* filtro feDisplacementMap */
```

### 26. Tilt 3D + brilho que segue o mouse  `[Desktop]`
- **Onde:** Card do verificador e cards de planos.
- **Por quê:** Profundidade premium.
- **Referência:** https://freefrontend.com/css-liquid-glass/
- **Performance/reduced-motion:** Máx. 6° de rotação; desligar em touch.
```css
el.onpointermove=e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px')}
.card{background:radial-gradient(circle at var(--mx) var(--my),#fff3,transparent 40%)}
```

### 27. Orbs de fundo com parallax do mouse  `[Desktop]`
- **Onde:** Fundo .orbs já existente.
- **Por quê:** Fundo vivo que reage ao usuário.
- **Referência:** https://motion.dev/docs/react-use-scroll
- **Performance/reduced-motion:** Já tem blur(60px) em tela inteira: caro; reduzir a 1 camada no mobile.
```css
orb.style.transform=`translate3d(${x*20}px,${y*20}px,0)`
```

### 28. Fundo animado WebGL (mesh gradient)  `[Desktop]`
- **Onde:** Hero desktop (opcional).
- **Por quê:** Fundo 'Stripe-like' fluido, marca forte.
- **Referência:** https://kevinhufnagl.com/how-to-stripe-website-gradient-effect/
- **Performance/reduced-motion:** Pausar quando fora da tela (IntersectionObserver) e em reduced-motion.
```css
// ou shader em <canvas> com OGL
```

### 29. Lente de vidro arrastável sobre o print do golpe — TOP10 #02  `[Desktop]`
- **Onde:** Seção 'Como funciona' passo 2.
- **Por quê:** Metáfora de 'investigar com lupa'.
- **Referência:** https://codepen.io/jh3y/pen/EajLxJV
- **Performance/reduced-motion:** Pointer events; teclado com setas para acessibilidade.
```css
.lens{backdrop-filter:url(#lens);touch-action:none}
```

### 30. Simulação ao vivo do veredito (mock animado)  `[Ambos]`
- **Onde:** Seção 'Como funciona'.
- **Por quê:** Mostra o produto funcionando antes do cadastro.
- **Referência:** https://motion.dev/docs/react-animation
- **Performance/reduced-motion:** Loop só quando visível.
```css
<motion.div animate={{width:['0%','100%']}} transition={{duration:1.4}}/> // barra 'analisando redirecionamentos'
```

### 31. Contador de números (1 a cada 2,3s, R$ 29 bi)  `[Ambos]`
- **Onde:** Seção #numeros.
- **Por quê:** Impacto dos dados quando entram na tela.
- **Referência:** https://motion.dev/docs/react-animate-number
- **Performance/reduced-motion:** Sem React: Intl.NumberFormat + rAF.
```css
import { AnimateNumber } from 'motion-plus/react'
<AnimateNumber locales='pt-BR'>{29}</AnimateNumber>
```

### 32. Ticker 'tentativa de fraude agora' a cada 2,3s  `[Ambos]`
- **Onde:** Seção #numeros.
- **Por quê:** Transforma estatística em sensação real de urgência.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **Performance/reduced-motion:** Indicar que é ilustrativo (não fake data).
```css
.pulse{animation:ping 2.3s infinite}
@keyframes ping{to{transform:scale(2.2);opacity:0}}
```

### 33. Barras do ranking de golpes crescendo (45%, 34%…)  `[Ambos]`
- **Onde:** Seção 'Tipos de golpe'.
- **Por quê:** Torna os percentuais legíveis num relance.
- **Referência:** https://scroll-driven-animations.style/
- **Performance/reduced-motion:** transform-origin:left.
```css
.bar{animation:fill linear both;animation-timeline:view();animation-range:entry 10% cover 40%}
@keyframes fill{from{transform:scaleX(0)}}
```

### 34. Seção sticky com passos (scrollytelling)  `[Desktop]`
- **Onde:** 'Três passos': o celular fica fixo e o conteúdo troca.
- **Por quê:** Narrativa clara do processo.
- **Referência:** https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **Performance/reduced-motion:** No mobile: virar carrossel com scroll-snap.
```css
ScrollTrigger.create({trigger:'#como',pin:'.phone',start:'top top',end:'+=200%'})
```

### 35. Carrossel com scroll-snap e indicador  `[Mobile]`
- **Onde:** Passos e tipos de golpe no celular.
- **Por quê:** Swipe nativo, 0 JS.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type
- **Performance/reduced-motion:** Usar ::scroll-marker (Chrome 135+) como bônus.
```css
.row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory}
.row>*{scroll-snap-align:center;flex:0 0 85%}
```

### 36. Marquee de logos/parceiros (Febraban, Serasa como fontes)  `[Ambos]`
- **Onde:** Faixa 'Fontes de dados'.
- **Por quê:** Credibilidade.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image
- **Performance/reduced-motion:** Pausar em hover e reduced-motion.
```css
.track{animation:scroll 30s linear infinite;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
```

### 37. Bento grid com entrada escalonada  `[Desktop]`
- **Onde:** Tipos de golpe (6 cards).
- **Por quê:** Layout moderno estilo Apple/Linear.
- **Referência:** https://motion.dev/docs/stagger
- **Performance/reduced-motion:** Uma vez só (once:true).
```css
animate('.bento>*',{opacity:[0,1],y:[24,0]},{delay:stagger(.06)})
```

### 38. Reveal por scroll (view timeline) em CSS puro  `[Ambos]`
- **Onde:** Todas as seções.
- **Por quê:** Substitui JS de reveal; mais leve.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view
- **Performance/reduced-motion:** Ótimo no mobile (thread do compositor).
```css
.reveal{animation:up both;animation-timeline:view();animation-range:entry 0 cover 30%}
@keyframes up{from{opacity:0;translate:0 32px}}
```

### 39. Texto com gradiente que preenche ao rolar  `[Desktop]`
- **Onde:** Frase 'Não é azar. É indústria.'
- **Por quê:** Ênfase dramática.
- **Referência:** https://scroll-driven-animations.style/
- **Performance/reduced-motion:** background-clip:text — suporte amplo.
```css
h2{background:linear-gradient(90deg,#fff 50%,#fff3 50%) 100%/200% text;color:transparent;animation:fill linear;animation-timeline:view()}
```

### 40. Spotlight de borda nos cards (border glow segue o mouse)  `[Desktop]`
- **Onde:** Cards de planos e golpes.
- **Por quê:** Efeito Linear/Vercel, sofisticado.
- **Referência:** https://buildui.com/recipes/spotlight
- **Performance/reduced-motion:** Um listener no container (delegação).
```css
.card{background:radial-gradient(400px at var(--x) var(--y),#4d9fff22,transparent)}
```

### 41. Grain/ruído animado sutil  `[Ambos]`
- **Onde:** Fundo (.grain já existe).
- **Por quê:** Tira o aspecto 'digital chapado'.
- **Referência:** https://css-tricks.com/grainy-gradients/
- **Performance/reduced-motion:** Opacidade ≤ .05; desligar em reduced-motion.
```css
.grain{animation:shift .8s steps(4) infinite}
```

### 42. Cursor customizado (ponto + anel)  `[Desktop]`
- **Onde:** Desktop todo (opcional).
- **Por quê:** Detalhe premium.
- **Referência:** https://motion.dev/docs/cursor
- **Performance/reduced-motion:** Nunca esconder cursor nativo em campos de texto.
```css
import { Cursor } from 'motion-plus/react'
```


## C. Microinterações, formulários, resultado, painel, admin e PWA

### 43. Imagem/print com efeito 'scanner' (linha varrendo) — AUREL #008  `[Ambos]`
- **Onde:** Ao analisar o print enviado.
- **Por quê:** Comunica 'estamos investigando'.
- **Referência:** https://freefrontend.com/css-loaders/
- **Performance/reduced-motion:** Só enquanto a requisição real estiver pendente.
```css
.scan::after{content:'';position:absolute;inset:0;background:linear-gradient(transparent,#4d9fff55,transparent);animation:scan 1.6s infinite}
```

### 44. Botão magnético  `[Desktop]`
- **Onde:** CTA 'Verificar' e 'Criar conta'.
- **Por quê:** Puxa o cursor, convida o clique.
- **Referência:** https://motion.dev/docs/react-gestures
- **Performance/reduced-motion:** Só pointer:fine.
```css
onPointerMove: x=(e.clientX-cx)*.3 → <motion.button animate={{x,y}} transition={{type:'spring',stiffness:300,damping:15}}/>
```

### 45. Botão com estado (Verificar → spinner → ✓) morph — AUREL #087  `[Ambos]`
- **Onde:** Botão Verificar.
- **Por quê:** Feedback contínuo sem trocar de componente.
- **Referência:** https://freefrontend.com/css-buttons/
- **Performance/reduced-motion:** aria-busy=true durante loading.
```css
<motion.button layout>{state==='load'?<Spinner/>:'Verificar'}</motion.button>
```

### 46. Botão conic com borda girando — TOP10 #08  `[Ambos]`
- **Onde:** CTA principal de planos.
- **Por quê:** Borda luminosa animada via @property.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- **Performance/reduced-motion:** Só em 1 CTA por tela.
```css
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
.btn{background:conic-gradient(from var(--a),#4d9fff,#2fd39b,#4d9fff);animation:spin 3s linear infinite}
@keyframes spin{to{--a:360deg}}
```

### 47. Botão de vidro óptico (multi inset-shadow) — TOP10 #09  `[Ambos]`
- **Onde:** Botões secundários.
- **Por quê:** Vidro 'líquido' com volume, sem filtro caro.
- **Referência:** https://freefrontend.com/css-liquid-glass/
- **Performance/reduced-motion:** Barato: só sombras.
```css
.btn{background:#ffffff14;box-shadow:inset 0 1px 0 #fff6,inset 0 -1px 0 #0003,0 8px 24px #0004}
```

### 48. Ripple/press scale no toque  `[Mobile]`
- **Onde:** Todos os botões no celular.
- **Por quê:** Confirma o toque instantaneamente.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/:active
- **Performance/reduced-motion:** Feedback < 100 ms.
```css
button:active{transform:scale(.97);transition:transform .08s}
```

### 49. Vibração háptica no veredito  `[Mobile]`
- **Onde:** Resultado 'É golpe'.
- **Por quê:** Alerta físico (Android).
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
- **Performance/reduced-motion:** iOS Safari não suporta; ignorar silenciosamente.
```css
if(veredito==='golpe') navigator.vibrate?.([30,40,30])
```

### 50. Toggle gooey de tema claro/escuro — TOP10 #05/#07  `[Ambos]`
- **Onde:** Preferência de tema.
- **Por quê:** Divertido e coerente com o 'líquido'.
- **Referência:** https://codepen.io/jh3y/pen/bNVWoBW
- **Performance/reduced-motion:** Seguir prefers-color-scheme na 1ª visita.
```css
<button role='switch' aria-checked='true'>…</button>
```

### 51. Troca de tema com círculo expandindo (View Transition)  `[Ambos]`
- **Onde:** Toggle de tema.
- **Por quê:** Efeito 'wow' de baixo custo.
- **Referência:** https://akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/
- **Performance/reduced-motion:** Fallback: troca direta.
```css
document.startViewTransition(()=>root.classList.toggle('dark')).ready.then(()=>root.animate({clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:500,pseudoElement:'::view-transition-new(root)'}))
```

### 52. Input com rótulo flutuante — AUREL #076  `[Ambos]`
- **Onde:** Login/cadastro.
- **Por quê:** Economiza espaço, mantém contexto.
- **Referência:** https://freefrontend.com/css-forms/
- **Performance/reduced-motion:** Label real (acessível).
```css
input:not(:placeholder-shown)+label,input:focus+label{transform:translateY(-140%) scale(.85)}
```

### 53. Detecção ao colar (paste) com chip do domínio  `[Ambos]`
- **Onde:** Campo do verificador.
- **Por quê:** Ao colar, o domínio vira chip com favicon: o usuário vê o que vai ser checado.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
- **Performance/reduced-motion:** Não carregar favicon do site suspeito direto (privacidade): usar proxy do servidor.
```css
input.addEventListener('paste',e=>{const u=new URL(e.clipboardData.getData('text'));showChip(u.hostname)})
```

### 54. Zona de arrastar print com borda pulsante — AUREL #084  `[Desktop]`
- **Onde:** 'Pode arrastar o print…'.
- **Por quê:** Estado de drop claro.
- **Referência:** https://freefrontend.com/css-forms/
- **Performance/reduced-motion:** dragenter/leave com contador.
```css
.drop.over{outline:2px dashed var(--sky);animation:breath 1s infinite alternate}
```

### 55. Botão 'colar da área de transferência'  `[Mobile]`
- **Onde:** Campo do verificador no celular.
- **Por quê:** No celular colar é difícil; 1 toque.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText
- **Performance/reduced-motion:** Pede permissão; esconder se API ausente.
```css
btn.onclick=async()=>input.value=await navigator.clipboard.readText()
```

### 56. Copiar com feedback (✓ Copiado) — AUREL #099  `[Ambos]`
- **Onde:** Copiar link do relatório/compartilhar.
- **Por quê:** Confirmação inequívoca.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- **Performance/reduced-motion:** Reset em 1,5 s.
```css
await navigator.clipboard.writeText(url);setCopied(true)
```

### 57. Web Share nativo do resultado  `[Mobile]`
- **Onde:** 'Avise sua família: esse link é golpe'.
- **Por quê:** Viraliza o produto pelo WhatsApp.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- **Performance/reduced-motion:** Fallback: wa.me link.
```css
navigator.share({title:'confia?',text:'Esse link é golpe',url})
```

### 58. Senha revelável + medidor de força — AUREL #078  `[Ambos]`
- **Onde:** Cadastro.
- **Por quê:** Segurança coerente com a marca.
- **Referência:** https://github.com/dropbox/zxcvbn
- **Performance/reduced-motion:** zxcvbn é pesado: lazy import.
```css
<button aria-pressed={show} onClick={()=>setShow(!show)}>👁</button>
```

### 59. Validação progressiva inline — AUREL #077/#094  `[Ambos]`
- **Onde:** Formulários (cadastro, denunciar, registrar-loja).
- **Por quê:** Erro no momento certo (on blur), sem susto.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid
- **Performance/reduced-motion:** aria-describedby para a mensagem.
```css
input:user-invalid{border-color:var(--risk)}
```

### 60. Formulário por etapas (stepper) — AUREL #083  `[Ambos]`
- **Onde:** registrar-loja.html e denunciar.html.
- **Por quê:** Reduz abandono em formulários longos.
- **Referência:** https://freefrontend.com/css-forms/
- **Performance/reduced-motion:** Salvar rascunho (AUREL #093/#100).
```css
<AnimatePresence mode='wait'><motion.div key={step} initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-40,opacity:0}}/></AnimatePresence>
```

### 61. Autosave de rascunho com indicador  `[Ambos]`
- **Onde:** Denúncia longa.
- **Por quê:** Não perder relato da vítima.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **Performance/reduced-motion:** Não salvar dados sensíveis (CPF) em localStorage.
```css
useEffect(()=>{const t=setTimeout(()=>localStorage.setItem('denuncia',JSON.stringify(f)),600);return()=>clearTimeout(t)},[f])
```

### 62. Toasts empilhados com swipe para fechar  `[Ambos]`
- **Onde:** Feedback global.
- **Por quê:** Padrão Sonner: elegante e acessível.
- **Referência:** https://sonner.emilkowal.ski/
- **Performance/reduced-motion:** Já tem aria-live.
```css
import { Toaster, toast } from 'sonner'
toast.success('Verificação salva')
```

### 63. Desfazer exclusão (undo toast) — AUREL #090  `[Ambos]`
- **Onde:** Apagar item do histórico.
- **Por quê:** Evita modal de confirmação chato.
- **Referência:** https://sonner.emilkowal.ski/
- **Performance/reduced-motion:** Excluir de fato só após o timeout.
```css
toast('Removido',{action:{label:'Desfazer',onClick:restore}})
```

### 64. Modal/dialog nativo com entrada animada (@starting-style)  `[Ambos]`
- **Onde:** Confirmações e login rápido.
- **Por quê:** Animação de entrada sem JS.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- **Performance/reduced-motion:** Nativo; foco preso automaticamente.
```css
dialog[open]{opacity:1;transition:opacity .2s,display .2s allow-discrete,overlay .2s allow-discrete}
@starting-style{dialog[open]{opacity:0}}
```

### 65. Popover API para menus/tooltip  `[Ambos]`
- **Onde:** Menu de conta, dicas de termos.
- **Por quê:** Sem lib, acessível, top-layer.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- **Performance/reduced-motion:** Combinar com anchor positioning.
```css
<button popovertarget='m'>Conta</button><div id='m' popover>…</div>
```

### 66. CSS Anchor Positioning para tooltips  `[Desktop]`
- **Onde:** Dicas em 'Ranking Febraban', ícones de status.
- **Por quê:** Tooltip sempre bem posicionado.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning
- **Performance/reduced-motion:** Chrome 125+; fallback Floating UI.
```css
.tip{position-anchor:--i;position-area:top;position-try-fallbacks:flip-block}
```

### 67. Accordion com altura animada (interpolate-size)  `[Ambos]`
- **Onde:** FAQ/Ajuda.
- **Por quê:** Abre suave sem medir altura via JS.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size
- **Performance/reduced-motion:** Chrome 129+; nos outros abre sem animar.
```css
:root{interpolate-size:allow-keywords}
details::details-content{height:0;overflow:clip;transition:height .3s,content-visibility .3s allow-discrete}
details[open]::details-content{height:auto}
```

### 68. Tabs elásticas com pill que desliza — AUREL #033  `[Ambos]`
- **Onde:** Planos mensal/anual.
- **Por quê:** Clareza da seleção.
- **Referência:** https://motion.dev/docs/react-layout-animations
- **Performance/reduced-motion:** layout anima transform, barato.
```css
{sel&&<motion.div layoutId='pill'/>}
```

### 69. Card que expande para detalhe (shared layout) — AUREL #012  `[Ambos]`
- **Onde:** Tipo de golpe → página do golpe.
- **Por quê:** Continuidade espacial premium.
- **Referência:** https://motion.dev/docs/react-layout-animations
- **Performance/reduced-motion:** Em MPA usar view-transition-name.
```css
<motion.article layoutId={`golpe-${id}`}/> // no detalhe, mesmo layoutId
```

### 70. Badge de status com pulso (verificamos / em construção)  `[Ambos]`
- **Onde:** Cards de tipos de golpe.
- **Por quê:** Honestidade visual do que já é coberto.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **Performance/reduced-motion:** Só o 'verificamos' pulsa.
```css
.badge.live::before{animation:ping 1.5s infinite}
```

### 71. Medidor radial de risco (gauge) — AUREL #062  `[Ambos]`
- **Onde:** Resultado: pontuação de risco 0–100.
- **Por quê:** Veredito compreensível sem texto técnico.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset
- **Performance/reduced-motion:** Cor muda: safe/warn/risk.
```css
circle{stroke-dasharray:283;stroke-dashoffset:calc(283 - 283*var(--p)/100);transition:stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)}
```

### 72. Veredito com selo animado (✓ / ⚠ / ✕) desenhado  `[Ambos]`
- **Onde:** Tela de resultado.
- **Por quê:** Momento-chave do produto: tem que ser memorável.
- **Referência:** https://lottiefiles.com/
- **Performance/reduced-motion:** SVG inline, sem Lottie pesado.
```css
path{stroke-dasharray:100;animation:draw .6s ease-out forwards}
@keyframes draw{from{stroke-dashoffset:100}}
```

### 73. Linha do tempo dos redirecionamentos  `[Ambos]`
- **Onde:** Resultado: 'link.curto → site X → site falso'.
- **Por quê:** Mostra a investigação de verdade — diferencial do Confia.
- **Referência:** https://freefrontend.com/css-timelines/
- **Performance/reduced-motion:** Lista semântica <ol>.
```css
.step{animation:in .3s both;animation-delay:calc(var(--i)*120ms)}
```

### 74. Confete discreto em 'Pode confiar'  `[Ambos]`
- **Onde:** Resultado seguro.
- **Por quê:** Alívio emocional (com moderação).
- **Referência:** https://github.com/catdad/canvas-confetti
- **Performance/reduced-motion:** Opção nativa de reduced-motion.
```css
import confetti from 'canvas-confetti'; confetti({particleCount:60,spread:55,disableForReducedMotion:true})
```

### 75. Shake no erro  `[Ambos]`
- **Onde:** Login inválido, link mal formatado.
- **Por quê:** Linguagem universal de 'não'.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation
- **Performance/reduced-motion:** Curto (300 ms) + mensagem textual.
```css
@keyframes shake{25%{translate:-6px}75%{translate:6px}}
```

### 76. Skeleton shimmer no histórico — AUREL #013–#018  `[Ambos]`
- **Onde:** Painel/histórico/admin.
- **Por quê:** Percepção de velocidade maior que spinner.
- **Referência:** https://freefrontend.com/css-skeleton-loadings/
- **Performance/reduced-motion:** Mesmo layout do conteúdo final.
```css
.sk{background:linear-gradient(90deg,#ffffff0d 25%,#ffffff1f 37%,#ffffff0d 63%) 0/400% 100%;animation:sh 1.4s infinite}
@keyframes sh{to{background-position:100% 0}}
```

### 77. Progresso real da análise (etapas do servidor via SSE)  `[Ambos]`
- **Onde:** Durante verificação: 'abrindo em ambiente isolado → seguindo redirecionamentos → WHOIS'.
- **Por quê:** Transparência = confiança. Ninguém espera 'em segundos' sem ver nada.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Performance/reduced-motion:** Mostrar % só se o backend der progresso real.
```css
const es=new EventSource('/api/verificar/'+id);es.onmessage=e=>setEtapa(JSON.parse(e.data))
```

### 78. Optimistic UI no histórico  `[Ambos]`
- **Onde:** Salvar/renomear verificação.
- **Por quê:** Interface instantânea.
- **Referência:** https://react.dev/reference/react/useOptimistic
- **Performance/reduced-motion:** Reverter com toast em erro.
```css
const [opt,add]=useOptimistic(lista,(s,n)=>[n,...s])
```

### 79. Lista com reordenação animada (FLIP)  `[Ambos]`
- **Onde:** Filtrar histórico por veredito.
- **Por quê:** Itens deslizam ao invés de pular.
- **Referência:** https://motion.dev/docs/react-layout-animations
- **Performance/reduced-motion:** Para listas > 100 itens, virtualizar.
```css
<motion.li layout key={id}/>
```

### 80. Auto-animate (drop-in) para listas simples  `[Ambos]`
- **Onde:** Admin: tabelas, filtros.
- **Por quê:** 1 linha de código, ganho grande.
- **Referência:** https://auto-animate.formkit.com/
- **Performance/reduced-motion:** Leve (~2 kB).
```css
import { useAutoAnimate } from '@formkit/auto-animate/react'
const [ref]=useAutoAnimate()
```

### 81. Swipe-to-action em itens (apagar/compartilhar)  `[Mobile]`
- **Onde:** Histórico no celular.
- **Por quê:** Gesto nativo de lista.
- **Referência:** https://motion.dev/docs/react-drag
- **Performance/reduced-motion:** Alternativa acessível: menu '⋯'.
```css
<motion.li drag='x' dragConstraints={{left:-120,right:0}} onDragEnd={...}/>
```

### 82. Long-press com menu contextual  `[Mobile]`
- **Onde:** Itens de histórico.
- **Por quê:** Paridade com apps.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
- **Performance/reduced-motion:** No iOS usar timer de 500 ms em pointerdown.
```css
el.addEventListener('contextmenu',e=>{e.preventDefault();openSheet()})
```

### 83. Sparklines animadas — AUREL #052  `[Desktop]`
- **Onde:** Admin: verificações por dia.
- **Por quê:** Tendência em espaço mínimo.
- **Referência:** https://freefrontend.com/css-dashboards/
- **Performance/reduced-motion:** Desenhar só 1x.
```css
path{stroke-dasharray:var(--len);animation:draw 1s forwards}
```

### 84. KPIs com contagem — AUREL #051  `[Desktop]`
- **Onde:** Admin: total de golpes detectados, usuários.
- **Por quê:** Dashboard vivo.
- **Referência:** https://motion.dev/docs/react-animate-number
- **Performance/reduced-motion:** Intl pt-BR.
```css
animate(0,total,{duration:1,onUpdate:v=>el.textContent=fmt(v)})
```

### 85. Heatmap de golpes por hora/dia — AUREL #054  `[Desktop]`
- **Onde:** Admin/observatório público.
- **Por quê:** Conteúdo diferencial (dados próprios).
- **Referência:** https://freefrontend.com/css-dashboards/
- **Performance/reduced-motion:** CSS grid; tooltip com anchor.
```css
.cell{background:color-mix(in oklab,var(--risk) calc(var(--v)*1%),transparent)}
```

### 86. Mapa do Brasil com golpes por estado (hover destaca)  `[Desktop]`
- **Onde:** Observatório público (feature nova).
- **Por quê:** Imprensa e SEO adoram.
- **Referência:** https://simplemaps.com/resources/svg-br
- **Performance/reduced-motion:** SVG estático; dados agregados.
```css
path:hover{fill:var(--sky);transition:fill .2s}
```

### 87. Tabela responsiva que vira cards — AUREL #057  `[Mobile]`
- **Onde:** Admin no celular.
- **Por quê:** Tabela não cabe em 375 px.
- **Referência:** https://freefrontend.com/css-tables/
- **Performance/reduced-motion:** Manter <table> semântica no desktop.
```css
@media(max-width:640px){tr{display:grid;grid-template-columns:1fr 1fr}td::before{content:attr(data-label)}}
```

### 88. Densidade de tabela ajustável — AUREL #070  `[Desktop]`
- **Onde:** Admin.
- **Por quê:** Admin vê mais linhas.
- **Referência:** https://freefrontend.com/css-tables/
- **Performance/reduced-motion:** —
```css
table[data-density=compact] td{padding-block:4px}
```

### 89. Sidebar recolhível de vidro — AUREL #026/#027  `[Desktop]`
- **Onde:** Painel e admin desktop.
- **Por quê:** Mais área útil.
- **Referência:** https://freefrontend.com/css-sidebar-menus/
- **Performance/reduced-motion:** Animar grid-template-columns em vez de width do conteúdo.
```css
aside{width:var(--w);transition:width .25s}
```

### 90. Drawer lateral de edição — AUREL #092  `[Desktop]`
- **Onde:** Admin: editar denúncia/loja.
- **Por quê:** Edita sem perder a lista.
- **Referência:** https://www.radix-ui.com/primitives/docs/components/dialog
- **Performance/reduced-motion:** Radix cuida de foco/ESC.
```css
<Dialog.Content className='drawer'/> .drawer{transform:translateX(100%)} [data-state=open]{transform:none}
```

### 91. Filtros avançados em chips animados — AUREL #048  `[Ambos]`
- **Onde:** Admin e página de Golpes.
- **Por quê:** Filtragem visual.
- **Referência:** https://freefrontend.com/css-dashboards/
- **Performance/reduced-motion:** —
```css
<motion.button layout className={on?'chip on':'chip'}/>
```

### 92. Busca expansível — AUREL #039  `[Ambos]`
- **Onde:** Header: buscar golpe conhecido.
- **Por quê:** Esconde complexidade até ser usada.
- **Referência:** https://freefrontend.com/css-search-boxes/
- **Performance/reduced-motion:** No mobile abrir tela cheia.
```css
input{width:40px;transition:width .3s} input:focus{width:260px}
```

### 93. Estado vazio inteligente — AUREL #071  `[Ambos]`
- **Onde:** Histórico vazio.
- **Por quê:** Converte: 'Cole seu primeiro link'.
- **Referência:** https://freefrontend.com/css-dashboards/
- **Performance/reduced-motion:** Ilustração SVG leve.
```css
<Empty icon={<ShieldCheck/>} cta='Verificar agora'/>
```

### 94. Notificação in-app (sino com badge pulsando) — AUREL #042  `[Ambos]`
- **Onde:** Alerta: 'loja que você verificou virou golpe'.
- **Por quê:** Retenção com valor real.
- **Referência:** https://freefrontend.com/css-notifications/
- **Performance/reduced-motion:** Agrupar notificações.
```css
.bell.new{animation:ring .6s 2}
```

### 95. Banner de instalação do PWA (bottom sheet custom)  `[Mobile]`
- **Onde:** 2ª visita no celular: 'Instale o confia? no celular'.
- **Por quê:** É o 'baixar pelo celular' que o Kainã pediu.
- **Referência:** https://web.dev/articles/customize-install
- **Performance/reduced-motion:** iOS: mostrar instrução 'Compartilhar → Adicionar à Tela de Início'.
```css
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;showSheet()})
btn.onclick=()=>deferred.prompt()
```

### 96. Splash screen do PWA + transição para app  `[Mobile]`
- **Onde:** Abertura do app instalado.
- **Por quê:** Experiência nativa.
- **Referência:** https://web.dev/articles/add-manifest
- **Performance/reduced-motion:** Ícones maskable 512 px.
```css
"background_color":"#07182c","theme_color":"#0b2443","display":"standalone"
```

### 97. Share Target: receber link compartilhado do WhatsApp direto no Confia  `[Mobile]`
- **Onde:** PWA instalado: no WhatsApp, 'Compartilhar → confia?'.
- **Por quê:** Killer feature: verificar sem copiar/colar.
- **Referência:** https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
- **Performance/reduced-motion:** Android/Chrome; iOS não suporta.
```css
"share_target":{"action":"/verificar","method":"GET","params":{"url":"url","text":"text"}}
```

### 98. Offline elegante (página offline animada)  `[Mobile]`
- **Onde:** Sem internet no PWA.
- **Por quê:** Não mostra o dinossauro.
- **Referência:** https://developer.chrome.com/docs/workbox/
- **Performance/reduced-motion:** Cache só do shell, nunca de resultados privados.
```css
// Workbox: offlineFallback({pageFallback:'/offline.html'})
```

### 99. Safe-area e barra de status integradas  `[Mobile]`
- **Onde:** PWA no iPhone.
- **Por quê:** Visual de app de verdade.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/env
- **Performance/reduced-motion:** meta viewport viewport-fit=cover.
```css
header{padding-top:env(safe-area-inset-top)}
```

### 100. Teclado virtual sem pular layout (interactive-widget)  `[Mobile]`
- **Onde:** Campo do verificador fixo embaixo.
- **Por quê:** O botão Verificar fica acima do teclado.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport
- **Performance/reduced-motion:** Usar dvh em vez de vh.
```css
<meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">
```

### 101. Unidades dvh/svh para telas cheias  `[Mobile]`
- **Onde:** Hero e telas de app.
- **Por quê:** Evita corte com barra do navegador.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/length#relative_length_units_based_on_viewport
- **Performance/reduced-motion:** —
```css
.hero{min-height:100svh}
```

### 102. Container queries para cards que se adaptam  `[Ambos]`
- **Onde:** Cards reutilizados em grid e sidebar.
- **Por quê:** Componente responsivo de verdade, desktop e mobile distintos.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries
- **Performance/reduced-motion:** Suporte amplo.
```css
.wrap{container-type:inline-size}
@container (min-width:420px){.card{grid-template-columns:auto 1fr}}
```

### 103. Layout mobile dedicado: verificador fixo no rodapé (thumb zone)  `[Mobile]`
- **Onde:** Home mobile.
- **Por quê:** No celular o produto é o campo; deve estar sempre ao alcance do polegar.
- **Referência:** https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/
- **Performance/reduced-motion:** Esconder no scroll down, mostrar no up.
```css
.verif-bar{position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom)}
```

### 104. Layout desktop dedicado: split hero (texto | demo ao vivo)  `[Desktop]`
- **Onde:** Home desktop.
- **Por quê:** Usa a largura para mostrar o produto funcionando.
- **Referência:** https://www.awwwards.com/
- **Performance/reduced-motion:** —
```css
.hero{display:grid;grid-template-columns:1.1fr .9fr}
```

### 105. Liquid Glass completo (SVG displacement + specular)  `[Desktop]`
- **Onde:** Card do verificador / dock.
- **Por quê:** Tendência 2025–26 (Apple Liquid Glass) — o 'glaze' pedido.
- **Referência:** https://kube.io/blog/liquid-glass-css-svg/
- **Performance/reduced-motion:** Chromium only; Safari/Firefox → blur + saturate.
```css
<filter id='lg'><feTurbulence/><feDisplacementMap in='SourceGraphic' scale='40'/></filter>
.glass{backdrop-filter:url(#lg)}
```

### 106. Glass fallback universal (blur + saturate + borda luz)  `[Ambos]`
- **Onde:** Todo vidro do site.
- **Por quê:** Funciona em todos navegadores, leve.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- **Performance/reduced-motion:** No mobile: blur ≤ 12px e poucas camadas.
```css
.glass{background:rgb(255 255 255/.08);backdrop-filter:blur(16px) saturate(160%);border:1px solid rgb(255 255 255/.18)}
```

### 107. Slider de vidro (ex.: nível de desconfiança) — TOP10 #06  `[Ambos]`
- **Onde:** Configurações de alertas.
- **Por quê:** Coerência com tema glass.
- **Referência:** https://codepen.io/maxuiux/pen/VYLQJoy
- **Performance/reduced-motion:** <input range> nativo acessível.
```css
input[type=range]::-webkit-slider-thumb{backdrop-filter:blur(6px)}
```

### 108. Shader WebGL de refração — TOP10 #10  `[Desktop]`
- **Onde:** Hero experimental (apenas desktop potente).
- **Por quê:** Efeito de vitrine/portfolio.
- **Referência:** https://codepen.io/shingidad/pen/jEPxMgW
- **Performance/reduced-motion:** Desligar em bateria fraca/mobile.
```css
// canvas WebGL; detectar falta de WebGL
```

### 109. Lenis smooth scroll (desktop)  `[Desktop]`
- **Onde:** Home desktop.
- **Por quê:** Rolagem amanteigada que combina com ScrollTrigger.
- **Referência:** https://lenis.darkroom.engineering/
- **Performance/reduced-motion:** NÃO usar no mobile; respeitar reduced-motion.
```css
import Lenis from 'lenis'; const l=new Lenis({autoRaf:true})
```

### 110. Horizontal scroll pinado (tipos de golpe)  `[Desktop]`
- **Onde:** Seção 'Não é só link falso'.
- **Por quê:** Galeria imersiva.
- **Referência:** https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **Performance/reduced-motion:** Mobile: scroll-snap.
```css
gsap.to('.track',{x:()=>-(track.scrollWidth-innerWidth),scrollTrigger:{pin:true,scrub:1,end:()=>'+='+track.scrollWidth}})
```

### 111. Flip de cartão 'golpe vs real' (comparar site falso e oficial)  `[Ambos]`
- **Onde:** Seção educativa.
- **Por quê:** Ensina a reconhecer detalhes.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility
- **Performance/reduced-motion:** Botão acessível para virar.
```css
.card{transform-style:preserve-3d;transition:transform .6s}.card.flip{transform:rotateY(180deg)}
```

### 112. Antes/depois arrastável (comparador de prints)  `[Ambos]`
- **Onde:** Educação: site falso × oficial.
- **Por quê:** Interativo e didático.
- **Referência:** https://github.com/sneas/img-comparison-slider
- **Performance/reduced-motion:** Web component leve.
```css
<img-comparison-slider><img slot='first'/><img slot='second'/></img-comparison-slider>
```

### 113. Quiz 'Você cairia nesse golpe?' com cartas swipe (Tinder-like)  `[Mobile]`
- **Onde:** Seção educativa/viral.
- **Por quê:** Engajamento e compartilhamento entre jovens (+43%).
- **Referência:** https://motion.dev/docs/react-drag
- **Performance/reduced-motion:** Botões alternativos.
```css
<motion.div drag='x' onDragEnd={(e,i)=>i.offset.x>100?resp('real'):i.offset.x<-100&&resp('golpe')}/>
```

### 114. Hover de ícone animado (Lucide animated / Lordicon)  `[Desktop]`
- **Onde:** Ícones dos 6 tipos de golpe.
- **Por quê:** Dá vida a ícones sem vídeo.
- **Referência:** https://lucide-animated.com/
- **Performance/reduced-motion:** Só em hover; estático no mobile.
```css
// componente com motion: anima path ao hover
```

### 115. Link underline animado  `[Desktop]`
- **Onde:** Links do texto e rodapé.
- **Por quê:** Refinamento tipográfico.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration
- **Performance/reduced-motion:** —
```css
a{background:linear-gradient(currentColor 0 0) 0 100%/0 1px no-repeat;transition:background-size .3s}a:hover{background-size:100% 1px}
```

### 116. Focus ring animado e visível  `[Ambos]`
- **Onde:** Toda navegação por teclado.
- **Por quê:** Acessibilidade premium (WCAG 2.2).
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- **Performance/reduced-motion:** Obrigatório.
```css
:focus-visible{outline:3px solid var(--sky);outline-offset:3px;transition:outline-offset .15s}
```

### 117. Easing com spring nativo via linear()  `[Ambos]`
- **Onde:** Todos os bounces.
- **Por quê:** Spring realista sem JS.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
- **Performance/reduced-motion:** Gerar em https://linear-easing-generator.netlify.app/.
```css
--spring:linear(0,.009,.035 2.1%,.141,.281 6.7%,.723 12.9%,.938 16.7%,1.017,1.077,1.089 26.8%,1.073,1.022 38.6%,.999 45.8%,1)
```

### 118. Página 404 animada própria  `[Ambos]`
- **Onde:** 404.
- **Por quê:** Aproveita erro para reforçar marca.
- **Referência:** https://www.awwwards.com/
- **Performance/reduced-motion:** Leve.
```css
<h1 class='glitch'>404</h1> + CTA 'Verificar um link'
```

### 119. Estado 'sessão expirada' com reautenticação in-place  `[Ambos]`
- **Onde:** Painel.
- **Por quê:** Não perde o que o usuário fazia.
- **Referência:** https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
- **Performance/reduced-motion:** Sincroniza abas.
```css
new BroadcastChannel('auth').onmessage=()=>openLoginSheet()
```

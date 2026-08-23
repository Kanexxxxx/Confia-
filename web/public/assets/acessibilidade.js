/* =============================================================
   confiia.com.br — ACESSIBILIDADE
   Carregado por todas as páginas, junto com acessibilidade.css.

   POR QUE ISTO IMPORTA NESTE PRODUTO ESPECIFICAMENTE:
   Quem mais cai em golpe de central falsa e de boleto é justamente
   quem enxerga menos, escuta menos e tem menos intimidade com
   tecnologia. Um site antigolpe que só funciona para quem tem
   visão perfeita está deixando de fora exatamente o público que
   mais precisa dele.

   Além disso é lei: a Lei Brasileira de Inclusão (13.146/2015),
   artigo 63, obriga sites a serem acessíveis.

   O QUE ESTE ARQUIVO FAZ:
     - monta o botão e o painel (nenhuma página precisa de HTML
       novo — por isso funciona igual nas 10 páginas)
     - guarda a escolha da pessoa no navegador
     - carrega o VLibras SOB DEMANDA (ver o porquê lá embaixo)

   CUIDADO AO MEXER:
     - O painel é ele próprio um componente acessível: abre com
       teclado, fecha com Esc, devolve o foco de onde veio e usa
       aria-pressed nos interruptores. Se mexer, mantenha isso.
   ============================================================= */

(function () {
'use strict';

var CHAVE = 'confia_acessibilidade';

/* O que dá para ajustar. `attr` é o atributo escrito no <html>,
   e é ele que o acessibilidade.css lê. */
var AJUSTES = {
  texto:     { attr: 'data-texto',     padrao: '0' },
  contraste: { attr: 'data-contraste', padrao: 'normal' },
  leitura:   { attr: 'data-leitura',   padrao: 'normal' },
  links:     { attr: 'data-links',     padrao: 'normal' },
  animacao:  { attr: 'data-animacao',  padrao: 'normal' },
  libras:    { attr: null,             padrao: 'nao' }
};

var estado = {};

/* ---------- guardar e ler a escolha ---------- */
function carrega() {
  var salvo = {};
  try { salvo = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) {}
  Object.keys(AJUSTES).forEach(function (k) {
    estado[k] = salvo[k] || AJUSTES[k].padrao;
  });
}

function guarda() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {
    /* Modo anônimo bloqueia. A escolha vale só nesta visita —
       melhor isso do que quebrar a página. */
  }
}

function aplica() {
  var raiz = document.documentElement;
  Object.keys(AJUSTES).forEach(function (k) {
    var attr = AJUSTES[k].attr;
    if (!attr) return;
    if (estado[k] === AJUSTES[k].padrao) raiz.removeAttribute(attr);
    else raiz.setAttribute(attr, estado[k]);
  });
}

/* Aplica ANTES de desenhar o painel, para a página já nascer do
   jeito que a pessoa deixou — sem piscar no tamanho errado. */
carrega();
aplica();

/* =============================================================
   VLIBRAS — tradução para Libras, do governo federal

   Carregado SÓ quando a pessoa liga. Dois motivos:

   1. Privacidade. É um script de fora (vlibras.gov.br). Carregar
      em toda visita entregaria o IP de todo visitante a um
      terceiro, contra o que a nossa Política de Privacidade
      promete. Quem precisa de Libras liga e aceita; quem não
      precisa nunca faz esse pedido.

   2. Peso. São alguns megabytes. Em celular com internet ruim —
      de novo, parte do nosso público — isso é a diferença entre
      abrir e desistir.
   ============================================================= */
function ligaLibras(aoTerminar) {
  if (document.getElementById('vlibras-script')) { aoTerminar(true); return; }

  var caixa = document.createElement('div');
  caixa.setAttribute('vw', '');
  caixa.className = 'enabled';
  caixa.innerHTML =
    '<div vw-access-button class="active"></div>' +
    '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.appendChild(caixa);

  var s = document.createElement('script');
  s.id = 'vlibras-script';
  s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  s.onload = function () {
    try {
      new window.VLibras.Widget('https://vlibras.gov.br/app');
      aoTerminar(true);
    } catch (e) { aoTerminar(false); }
  };
  s.onerror = function () { caixa.remove(); aoTerminar(false); };
  document.body.appendChild(s);
}

function desligaLibras() {
  var s = document.getElementById('vlibras-script');
  var c = document.querySelector('[vw]');
  if (s) s.remove();
  if (c) c.remove();
  /* O plugin não tem "desligar"; recarregar é o jeito limpo. */
  location.reload();
}

/* =============================================================
   O PAINEL
   ============================================================= */
var botao, painel, fundo, focoAnterior;

function montaPainel() {
  botao = document.createElement('button');
  botao.className = 'a11y-botao';
  botao.type = 'button';
  botao.setAttribute('aria-label', 'Abrir opções de acessibilidade');
  botao.setAttribute('aria-expanded', 'false');
  botao.setAttribute('aria-controls', 'a11y-painel');
  botao.innerHTML = '<i class="bi bi-universal-access-circle" aria-hidden="true"></i>';
  /* Se o Bootstrap Icons não carregar, ainda aparece alguma coisa */
  botao.querySelector('i').style.fontStyle = 'normal';

  fundo = document.createElement('div');
  fundo.className = 'a11y-fundo';

  painel = document.createElement('div');
  painel.className = 'a11y-painel';
  painel.id = 'a11y-painel';
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-modal', 'false');
  painel.setAttribute('aria-labelledby', 'a11y-titulo');
  painel.innerHTML =
    '<h2 id="a11y-titulo"><i class="bi bi-universal-access" aria-hidden="true"></i> Acessibilidade</h2>' +
    '<p class="sub">Ajuste como o site aparece para você. Fica guardado neste navegador.</p>' +

    '<div class="a11y-grupo">' +
      '<b>Tamanho do texto</b>' +
      '<div class="a11y-tamanhos" role="group" aria-label="Tamanho do texto">' +
        '<button type="button" data-texto="0" aria-label="Tamanho normal">A</button>' +
        '<button type="button" data-texto="1" aria-label="Texto 15% maior">A</button>' +
        '<button type="button" data-texto="2" aria-label="Texto 30% maior">A</button>' +
        '<button type="button" data-texto="3" aria-label="Texto 50% maior">A</button>' +
      '</div>' +
    '</div>' +

    '<div class="a11y-grupo">' +
      '<b>Como você enxerga</b>' +
      botaoOpcao('contraste', 'alto', 'bi-circle-half', 'Alto contraste',
                 'Preto, branco e amarelo. Sem gradiente nem transparência.') +
      botaoOpcao('links', 'destacados', 'bi-link-45deg', 'Destacar links',
                 'Sublinha todos os links, para não depender só da cor.') +
    '</div>' +

    '<div class="a11y-grupo">' +
      '<b>Como você lê</b>' +
      botaoOpcao('leitura', 'solto', 'bi-text-paragraph', 'Espaçar o texto',
                 'Mais espaço entre letras, palavras e linhas. Ajuda na dislexia.') +
      botaoOpcao('animacao', 'reduzida', 'bi-pause-circle', 'Reduzir animação',
                 'Desliga movimento na tela. Ajuda quem sente tontura.') +
    '</div>' +

    '<div class="a11y-grupo">' +
      '<b>Libras</b>' +
      botaoOpcao('libras', 'sim', 'bi-hand-index-thumb', 'Tradutor de Libras',
                 'Abre o VLibras, do governo federal. Só carrega quando você liga.') +
    '</div>' +

    '<div class="a11y-pe">' +
      '<button type="button" id="a11y-limpar">Voltar ao padrão</button>' +
      '<span class="a11y-atalho"><kbd>Alt</kbd>+<kbd>A</kbd></span>' +
    '</div>';

  document.body.appendChild(botao);
  document.body.appendChild(fundo);
  document.body.appendChild(painel);
}

function botaoOpcao(chave, ligado, icone, titulo, ajuda) {
  return '<button class="a11y-opcao" type="button" data-ajuste="' + chave +
         '" data-ligado="' + ligado + '" aria-pressed="false">' +
         '<span class="ico"><i class="bi ' + icone + '" aria-hidden="true"></i></span>' +
         '<span class="txt">' + titulo + '<small>' + ajuda + '</small></span>' +
         '<span class="chave" aria-hidden="true"></span>' +
         '</button>';
}

/* Deixa os controles mostrando o estado de verdade */
function sincroniza() {
  painel.querySelectorAll('[data-texto]').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.texto === estado.texto));
  });
  painel.querySelectorAll('[data-ajuste]').forEach(function (b) {
    var lig = estado[b.dataset.ajuste] === b.dataset.ligado;
    b.setAttribute('aria-pressed', String(lig));
  });
}

/* Anúncio para quem usa leitor de tela: sem isto a pessoa liga o
   alto contraste e não recebe confirmação nenhuma. */
var avisador;
function avisa(texto) {
  if (!avisador) {
    avisador = document.createElement('div');
    avisador.setAttribute('aria-live', 'polite');
    avisador.setAttribute('role', 'status');
    avisador.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    document.body.appendChild(avisador);
  }
  avisador.textContent = '';
  setTimeout(function () { avisador.textContent = texto; }, 60);
}

function abre() {
  focoAnterior = document.activeElement;
  painel.setAttribute('data-aberto', '');
  fundo.setAttribute('data-aberto', '');
  botao.setAttribute('aria-expanded', 'true');
  var primeiro = painel.querySelector('button');
  if (primeiro) primeiro.focus();
}

function fecha() {
  painel.removeAttribute('data-aberto');
  fundo.removeAttribute('data-aberto');
  botao.setAttribute('aria-expanded', 'false');
  if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  else botao.focus();
}

function estaAberto() { return painel.hasAttribute('data-aberto'); }

/* =============================================================
   LIGAÇÕES
   ============================================================= */
function liga() {
  botao.addEventListener('click', function () { estaAberto() ? fecha() : abre(); });
  fundo.addEventListener('click', fecha);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && estaAberto()) { fecha(); return; }
    /* Alt+A abre de qualquer lugar da página */
    if (ev.altKey && (ev.key === 'a' || ev.key === 'A')) {
      ev.preventDefault();
      estaAberto() ? fecha() : abre();
    }
  });

  /* tamanho do texto */
  painel.querySelectorAll('[data-texto]').forEach(function (b) {
    b.addEventListener('click', function () {
      estado.texto = b.dataset.texto;
      aplica(); guarda(); sincroniza();
      var nomes = { '0': 'normal', '1': '15% maior', '2': '30% maior', '3': '50% maior' };
      avisa('Tamanho do texto: ' + nomes[estado.texto]);
    });
  });

  /* interruptores */
  painel.querySelectorAll('[data-ajuste]').forEach(function (b) {
    b.addEventListener('click', function () {
      var chave = b.dataset.ajuste;
      var ligando = estado[chave] !== b.dataset.ligado;

      if (chave === 'libras') {
        if (ligando) {
          b.setAttribute('aria-busy', 'true');
          avisa('Carregando o tradutor de Libras…');
          ligaLibras(function (deu) {
            b.removeAttribute('aria-busy');
            estado.libras = deu ? 'sim' : 'nao';
            guarda(); sincroniza();
            avisa(deu ? 'Tradutor de Libras ligado.'
                      : 'Não consegui carregar o tradutor de Libras. Tente de novo.');
          });
        } else {
          estado.libras = 'nao'; guarda(); desligaLibras();
        }
        return;
      }

      estado[chave] = ligando ? b.dataset.ligado : AJUSTES[chave].padrao;
      aplica(); guarda(); sincroniza();
      avisa(b.querySelector('.txt').childNodes[0].textContent.trim() +
            (ligando ? ' ligado.' : ' desligado.'));
    });
  });

  document.getElementById('a11y-limpar').addEventListener('click', function () {
    var tinhaLibras = estado.libras === 'sim';
    Object.keys(AJUSTES).forEach(function (k) { estado[k] = AJUSTES[k].padrao; });
    aplica(); guarda(); sincroniza();
    avisa('Tudo voltou ao padrão.');
    if (tinhaLibras) location.reload();
  });
}

/* =============================================================
   PARTIDA
   ============================================================= */
function comeca() {
  montaPainel();
  sincroniza();
  liga();
  if (estado.libras === 'sim') ligaLibras(function () {});

  /* O link "pular para o conteúdo" precisa levar o foco de verdade,
     não só rolar a página — senão a próxima tabulação volta para o
     começo e a pessoa fica presa num laço. */
  var pular = document.querySelector('.pular');
  var alvo = document.getElementById('conteudo');
  if (pular && alvo) {
    pular.addEventListener('click', function () {
      alvo.setAttribute('tabindex', '-1');
      setTimeout(function () { alvo.focus(); }, 0);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', comeca);
} else {
  comeca();
}

})();

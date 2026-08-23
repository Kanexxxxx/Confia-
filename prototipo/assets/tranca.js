/* =============================================================
   confiia.com.br — TRANCA DO PROTÓTIPO DO PAINEL
   Carregado por admin.html ANTES de admin.js.

   LEIA ISTO ANTES DE CONFIAR NESTE ARQUIVO
   ---------------------------------------------------------------
   Isto NÃO é segurança. É uma porta de banheiro: impede alguém de
   entrar sem querer, não impede quem quer entrar. Qualquer pessoa
   com o arquivo em mãos lê o código-fonte e passa por cima.

   Serve para duas coisas honestas:
     1. você não abrir o painel na frente de alguém sem perceber;
     2. o arquivo não ficar utilizável se cair no lugar errado.

   A segurança de verdade é do lado do servidor e mora no app
   Next.js (`app/`): sessão assinada, conferência da tabela
   `admins` a cada requisição e segundo fator obrigatório (TOTP).
   Enquanto isso não estiver no ar, este protótipo NÃO VAI PARA
   SERVIDOR NENHUM — nem "só para testar".

   COMO FUNCIONA
   Na primeira abertura você define uma senha local. Guardamos só
   o SHA-256 dela no localStorage deste navegador. A senha em si
   não fica em lugar nenhum: nem no arquivo, nem no disco, nem
   comigo. Esqueceu? Limpe os dados do site e defina outra.

   CUIDADO AO MEXER:
     - Este arquivo some quando o painel real entrar no ar.
       Se ele ainda existir depois disso, alguém esqueceu de apagar.
   ============================================================= */

(function () {
'use strict';

var CHAVE = 'confia_admin_tranca';
var tranca   = document.getElementById('tranca');
var form     = document.getElementById('tranca-form');
var campo    = document.getElementById('tranca-senha');
var campo2   = document.getElementById('tranca-senha2');
var recado   = document.getElementById('tranca-recado');
var titulo   = document.getElementById('tranca-titulo');
var texto    = document.getElementById('tranca-texto');
var botao    = document.getElementById('tranca-botao');
var linhaNova = document.getElementById('tranca-nova');
var esquerdo = document.getElementById('tranca-esqueci');

/* Sem WebCrypto (http:// antigo, navegador velho) não dá para
   comparar com segurança nenhuma. Melhor travar do que fingir. */
if (!window.crypto || !window.crypto.subtle) {
  titulo.textContent = 'Navegador sem suporte';
  texto.textContent = 'Este navegador não tem WebCrypto. Abra o arquivo em um navegador atual.';
  form.hidden = true;
  return;
}

function sha256(txt) {
  var dados = new TextEncoder().encode(txt);
  return crypto.subtle.digest('SHA-256', dados).then(function (buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  });
}

function guardado() {
  try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
}

var primeiraVez = !guardado();

/* --- primeira abertura: definir a senha --- */
if (primeiraVez) {
  titulo.textContent = 'Defina uma senha para este protótipo';
  texto.innerHTML = 'Ela fica só neste navegador, guardada como hash. ' +
    'Não é a senha do painel de verdade — é para o arquivo não ficar aberto na sua máquina.';
  linhaNova.hidden = false;
  botao.textContent = 'Definir e entrar';
}

function avisa(msg, tipo) {
  recado.className = 'tranca-recado ' + (tipo || 'ruim');
  recado.textContent = msg;
  recado.hidden = false;
}

function destranca() {
  tranca.remove();
  document.body.classList.remove('trancado');
  /* Só agora o painel monta. Antes disso o admin.js nem rodou. */
  document.dispatchEvent(new Event('confia:destrancado'));
}

form.addEventListener('submit', function (ev) {
  ev.preventDefault();
  recado.hidden = true;
  var senha = campo.value;

  if (primeiraVez) {
    if (senha.length < 8) { avisa('Use pelo menos 8 caracteres.'); return; }
    if (senha !== campo2.value) { avisa('As duas senhas não são iguais.'); return; }
    sha256(senha).then(function (h) {
      try { localStorage.setItem(CHAVE, h); }
      catch (e) { avisa('Este navegador não deixa guardar. Tente fora da janela anônima.'); return; }
      destranca();
    });
    return;
  }

  sha256(senha).then(function (h) {
    if (h === guardado()) { destranca(); }
    else { avisa('Senha errada.'); campo.value = ''; campo.focus(); }
  });
});

esquerdo.addEventListener('click', function () {
  if (!confirm('Isto apaga a senha guardada neste navegador e pede uma nova. Continuar?')) return;
  try { localStorage.removeItem(CHAVE); } catch (e) {}
  location.reload();
});

campo.focus();

})();

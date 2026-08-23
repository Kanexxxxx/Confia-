/* confia? — comportamento do site */

/* ---------- topo: estado de rolagem ---------- */
(function () {
  var tick = false;
  function onScroll() {
    if (tick) return;
    tick = true;
    requestAnimationFrame(function () {
      document.body.classList.toggle('is-scrolled', window.scrollY > 18);
      tick = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- vidro: indicador deslizante + brilho que segue o ponteiro ---------- */
(function () {
  var glass = document.getElementById('nav');
  if (!glass) return;

  var pin = document.getElementById('pin');
  var links = Array.prototype.slice.call(glass.querySelectorAll('.nav-link'));
  var atual = glass.querySelector('.nav-link[aria-current="page"]') || links[0];

  function mover(el) {
    if (!pin || !el) return;
    pin.style.width = el.offsetWidth + 'px';
    pin.style.transform = 'translateX(' + el.offsetLeft + 'px)';
  }

  // sem transição no primeiro posicionamento
  if (pin) {
    pin.style.transition = 'none';
    mover(atual);
    requestAnimationFrame(function () { pin.style.transition = ''; });
  }

  links.forEach(function (a) {
    a.addEventListener('pointerenter', function () { mover(a); });
    a.addEventListener('focus', function () { mover(a); });
  });
  glass.addEventListener('pointerleave', function () { mover(atual); });
  addEventListener('resize', function () { mover(atual); });


  // marca a seção visível como atual
  var secoes = links
    .map(function (a) {
      var id = a.getAttribute('href');
      return id && id.length > 1 && id.charAt(0) === '#'
        ? { link: a, el: document.querySelector(id) }
        : null;
    })
    .filter(function (s) { return s && s.el; });

  if (secoes.length && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var achou = secoes.filter(function (s) { return s.el === en.target; })[0];
        if (!achou || achou.link === atual) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        achou.link.setAttribute('aria-current', 'page');
        atual = achou.link;
        mover(atual);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(function (s) { obs.observe(s.el); });
  }
})();

/* ---------- verificador ---------- */
(function () {
  var form = document.getElementById('form');
  if (!form) return;

  var field = document.getElementById('field');
  var input = document.getElementById('alvo');
  var dica = document.getElementById('dica-txt');
  var status = document.getElementById('status');
  var statusTxt = document.getElementById('status-txt');
  var lista = document.getElementById('anexos');
  var fileInput = document.getElementById('arquivos');
  var btnVerificar = document.getElementById('btn-verificar');
  var dicaPadrao = dica ? dica.textContent : '';
  var arquivos = [];

  function limparErro() {
    field.classList.remove('has-error');
    if (dica) dica.textContent = dicaPadrao;
  }
  function erro(msg) {
    field.classList.add('has-error');
    if (dica) dica.textContent = msg;
    input.focus();
  }
  function desenharAnexos() {
    lista.textContent = '';
    arquivos.forEach(function (f, i) {
      var chip = document.createElement('span');
      chip.className = 'chip';

      var tipo = document.createElement('i');
      tipo.className = 'bi ' + (/^video\//.test(f.type) ? 'bi-camera-video-fill'
                     : /^image\//.test(f.type) ? 'bi-image-fill' : 'bi-file-earmark-fill');
      tipo.setAttribute('aria-hidden', 'true');

      var nome = document.createElement('span');
      nome.textContent = f.name;

      var x = document.createElement('button');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remover ' + f.name);
      x.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      x.addEventListener('click', function () {
        arquivos.splice(i, 1);
        desenharAnexos();
      });

      chip.appendChild(tipo);
      chip.appendChild(nome);
      chip.appendChild(x);
      lista.appendChild(chip);
    });
  }

  input.addEventListener('input', limparErro);

  function abrirArquivos() { fileInput.click(); }
  ['btn-anexar', 'btn-uploads'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', abrirArquivos);
  });

  fileInput.addEventListener('change', function () {
    arquivos = arquivos.concat(Array.prototype.slice.call(fileInput.files));
    fileInput.value = '';
    desenharAnexos();
    limparErro();
  });

  // arrastar e soltar
  var zona = document.querySelector('.screen') || document.querySelector('.card') || form;
  ['dragover', 'drop'].forEach(function (ev) {
    zona.addEventListener(ev, function (e) {
      e.preventDefault();
      if (ev === 'drop' && e.dataTransfer) {
        arquivos = arquivos.concat(Array.prototype.slice.call(e.dataTransfer.files));
        desenharAnexos();
        limparErro();
      }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valor = input.value.trim();
    if (!valor && !arquivos.length) {
      erro('Cole um link ou anexe um print para verificar.');
      return;
    }
    status.removeAttribute('data-show');
    btnVerificar.setAttribute('data-loading', '');

    setTimeout(function () {
      btnVerificar.removeAttribute('data-loading');
      var alvo = valor ? '“' + valor.slice(0, 60) + '”' : arquivos.length + ' arquivo(s)';
      statusTxt.textContent = '';
      var b = document.createElement('b');
      b.textContent = 'Interface pronta. ';
      statusTxt.appendChild(b);
      statusTxt.appendChild(document.createTextNode(
        'Falta ligar a análise no servidor para mostrar o veredito de ' + alvo + '.'
      ));
      status.setAttribute('data-show', '');
    }, 1100);
  });
})();

/* ---------- vidro: brilho que segue o ponteiro ---------- */
(function () {
  // o brilho segue o ponteiro em qualquer superficie de vidro
  Array.prototype.forEach.call(document.querySelectorAll('.lg'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

})();

/* ---------- entrada e revelacao ao rolar ---------- */
(function () {
  // cascata dos chips do hero
  var marks = document.getElementById('marks');
  if (marks) {
    Array.prototype.forEach.call(marks.children, function (el, i) {
      el.classList.add('rv');
      el.style.setProperty('--d', (0.44 + i * 0.07).toFixed(2) + 's');
    });
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add('is-ready'); });
  });

  var alvos = Array.prototype.slice.call(
    document.querySelectorAll('.rv, .sec-head, .step, .check, .pol, .aviso')
  );
  alvos.forEach(function (el) { if (!el.classList.contains('rv')) el.classList.add('rv'); });

  // escalona os cards de cada grade
  ['.steps', '.grid-check', '.grid-pol'].forEach(function (sel) {
    var grade = document.querySelector(sel);
    if (!grade) return;
    Array.prototype.forEach.call(grade.children, function (el, i) {
      el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
    });
  });

  if (!('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var obs = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      obs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  alvos.forEach(function (el) { obs.observe(el); });
})();

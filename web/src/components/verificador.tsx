'use client';

/* =============================================================
   confiia.com.br — o card que verifica

   É a coisa que a pessoa veio fazer. Tudo aqui é pensado para o
   momento em que ela está: com pressa, desconfiada, e muitas
   vezes já com o dinheiro na mão.

   TRÊS DECISÕES DE COMPORTAMENTO:

   1. O botão COLAR existe porque o link quase sempre vem de outro
      aplicativo. Segurar o dedo em cima do campo para colar é um
      gesto que muita gente de 60 anos não conhece.

   2. Arrastar o print para qualquer lugar do card funciona — não
      só em cima de uma área pequena. Quem está nervoso não acerta
      alvo pequeno.

   3. O erro nunca é "entrada inválida". É uma frase que diz o que
      fazer. A pessoa já está confusa; a mensagem não pode aumentar
      isso.

   4. O @ NÃO DIZ DE ONDE VEIO — 27/08/2026

      Um @ sozinho não identifica ninguém. O mesmo apelido existe
      no Instagram, no TikTok, no Telegram e no Kwai, e são
      pessoas DIFERENTES em cada um. Verificar "@lojafulana" sem
      saber a rede é chutar qual dos quatro perfis analisar — e
      chutar errado num site antigolpe é acusar inocente ou
      liberar golpista.

      Então: colou um @, aparece a escolha da rede, e sem ela o
      formulário não anda. Link colado inteiro
      (`instagram.com/fulana`) NÃO pergunta nada: o endereço já
      diz a rede.

   CUIDADO AO MEXER:
     - O motor de verificação (Etapa 8) ainda não existe. Enquanto
       não existir, este componente diz isso com todas as letras.
       NÃO invente um resultado de mentira aqui: um site antigolpe
       mostrando análise falsa é exatamente o que ele combate.
     - Se você acrescentar rede em REDES, lembre que a Etapa 8 vai
       precisar saber ler aquela rede. Oferecer na tela o que o
       motor não verifica é prometer o que não se entrega.
   ============================================================= */

import { useState, useRef, useCallback } from 'react';

type Anexo = { id: string; nome: string; tamanho: number };

const LIMITE_ARQUIVOS = 5;
const LIMITE_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

/* As redes onde golpe de perfil acontece no Brasil. A ordem é por
   frequência, não alfabética: a primeira é a que mais gente vai
   escolher, e ela precisa estar onde o dedo já está. */
const REDES = [
  { v: 'instagram', i: 'bi-instagram', t: 'Instagram' },
  { v: 'whatsapp',  i: 'bi-whatsapp',  t: 'WhatsApp' },
  { v: 'tiktok',    i: 'bi-tiktok',    t: 'TikTok' },
  { v: 'facebook',  i: 'bi-facebook',  t: 'Facebook' },
  { v: 'telegram',  i: 'bi-telegram',  t: 'Telegram' },
  { v: 'outra',     i: 'bi-three-dots', t: 'Outra' },
];

/* O QUE CONTA COMO "@"

   Duas formas, e as duas são conservadoras de propósito — errar
   para o lado de NÃO perguntar é melhor do que perguntar a rede
   de um link, que já traz a resposta no endereço.

     1. começa com @  →  sem dúvida é apelido;
     2. uma palavra só, sem ponto e sem barra, com pelo menos uma
        letra  →  "lojafulana" digitado sem o @.

   O item 2 exige letra para não pegar CNPJ nem telefone, que são
   só dígitos e pontuação. E exige ausência de ponto para não
   pegar "loja.com.br", que é site. */
function pareceArroba(texto: string) {
  const t = texto.trim();
  if (!t) return false;
  if (t.startsWith('@')) return true;
  if (/[.\/\s]/.test(t)) return false;
  return /[a-zA-Z]/.test(t) && t.length >= 2;
}

function tamanhoLegivel(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function Verificador() {
  const [alvo, setAlvo] = useState('');
  /* A rede só existe enquanto o alvo for um @. Ver `pareceArroba`
     e o comentário 4 no topo. */
  const [rede, setRede] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [recado, setRecado] = useState<{ tipo: 'info' | 'erro' | 'espera'; texto: string } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const entradaArquivo = useRef<HTMLInputElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  /* ---------- colar ---------- */
  const colar = useCallback(async () => {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto.trim()) {
        setAlvo(texto.trim());
        setRecado(null);
        campo.current?.focus();
      } else {
        setRecado({ tipo: 'info', texto: 'Não tem nada copiado no seu aparelho agora.' });
      }
    } catch {
      /* O navegador pode negar a permissão. Não adianta insistir:
         explique o caminho manual. */
      setRecado({
        tipo: 'info',
        texto: 'Seu navegador não deixou colar automaticamente. Cole no campo com Ctrl+V, ou segurando o dedo em cima dele.',
      });
    }
  }, []);

  /* ---------- anexos ---------- */
  const receber = useCallback((lista: FileList | null) => {
    if (!lista?.length) return;

    const novos: Anexo[] = [];
    let recusado: string | null = null;

    for (const f of Array.from(lista)) {
      if (anexos.length + novos.length >= LIMITE_ARQUIVOS) {
        recusado = `Dá para enviar até ${LIMITE_ARQUIVOS} arquivos de uma vez.`;
        break;
      }
      if (f.size > LIMITE_BYTES) {
        recusado = `"${f.name}" tem ${tamanhoLegivel(f.size)} e o limite é 10 MB. Tire um print da tela em vez de mandar o vídeo inteiro.`;
        continue;
      }
      novos.push({
        id: `${f.name}-${f.size}-${f.lastModified}`,
        nome: f.name,
        tamanho: f.size,
      });
    }

    if (novos.length) {
      setAnexos((a) => {
        const jaTem = new Set(a.map((x) => x.id));
        return [...a, ...novos.filter((n) => !jaTem.has(n.id))];
      });
    }
    setRecado(recusado ? { tipo: 'erro', texto: recusado } : null);
  }, [anexos.length]);

  const tirar = (id: string) => setAnexos((a) => a.filter((x) => x.id !== id));

  /* Derivado, não guardado em estado: se fosse um `useState` daria
     para ele discordar do que está escrito no campo — e aí a
     pergunta da rede apareceria para um link, ou sumiria para um
     @. Calculado a cada letra, isso não acontece. */
  const precisaDeRede = pareceArroba(alvo);

  /* ---------- envio ---------- */
  function enviar(ev: React.FormEvent) {
    ev.preventDefault();

    if (!alvo.trim() && anexos.length === 0) {
      setRecado({
        tipo: 'erro',
        texto: 'Cole um link, um @ de perfil, ou anexe o print da conversa.',
      });
      campo.current?.focus();
      return;
    }

    /* Sem a rede, o @ não identifica ninguém — ver o comentário 4
       no topo. Barrado aqui, e não lá na frente, porque é a última
       coisa que falta e a pessoa está com o dedo no botão. */
    if (precisaDeRede && !rede) {
      setRecado({
        tipo: 'erro',
        texto: 'Falta dizer de qual rede é esse @. O mesmo apelido existe em várias, e são pessoas diferentes em cada uma.',
      });
      return;
    }

    /* Honestidade acima de tudo: o motor de verificação entra na
       Etapa 8. Até lá, dizemos isso — em vez de fingir uma
       análise. Um site antigolpe mostrando resultado de mentira
       seria exatamente o que ele combate. */
    setRecado({
      tipo: 'espera',
      texto: 'A análise ainda está sendo construída. Assim que ficar pronta, é aqui que ela aparece — com o motivo de cada conclusão, não só um veredito.',
    });
  }

  return (
    <form
      id="form"
      noValidate
      onSubmit={enviar}
      onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastando(false); receber(e.dataTransfer.files); }}
    >
      <div className={`field${arrastando ? ' sobre' : ''}`} id="field">
        <label className="sr" htmlFor="alvo">Link, site ou perfil para verificar</label>
        <input
          ref={campo}
          id="alvo"
          name="alvo"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Cole o link ou o @ do perfil"
          aria-describedby="dica"
          value={alvo}
          onChange={(e) => { setAlvo(e.target.value); if (recado?.tipo === 'erro') setRecado(null); }}
        />
        <div className="field-tools">
          <button className="icon-btn" type="button" onClick={colar}
                  aria-label="Colar da área de transferência" title="Colar">
            <i className="bi bi-clipboard" aria-hidden="true" />
          </button>
          <button className="icon-btn" type="button" onClick={() => entradaArquivo.current?.click()}
                  aria-label="Anexar print ou foto" title="Anexar">
            <i className="bi bi-paperclip" aria-hidden="true" />
          </button>
        </div>
        <input
          ref={entradaArquivo}
          type="file"
          id="arquivos"
          multiple
          accept="image/*"
          hidden
          onChange={(e) => { receber(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* A PERGUNTA DA REDE — só quando ela existe

          Aparece e some conforme a pessoa digita. Isso é de
          propósito: perguntar a rede de um link seria burocracia,
          porque o endereço já responde. A pergunta só existe
          quando a resposta não está em lugar nenhum.

          `role="radiogroup"` porque é escolha única. Sem isso o
          leitor de tela anuncia seis caixas soltas e não diz que
          são alternativas da mesma pergunta. */}
      {precisaDeRede && (
        <fieldset className="redes">
          <legend>
            <i className="bi bi-question-circle" aria-hidden="true" /> Esse @ é de qual rede?
          </legend>
          <div className="redes-lista">
            {REDES.map((r) => (
              <label className="opcao" key={r.v}>
                <input
                  type="radio"
                  name="rede"
                  value={r.v}
                  checked={rede === r.v}
                  onChange={() => { setRede(r.v); if (recado?.tipo === 'erro') setRecado(null); }}
                />
                <span>
                  <i className={`bi ${r.i}`} aria-hidden="true" /> {r.t}
                </span>
              </label>
            ))}
          </div>
          <p className="redes-porque">
            O mesmo @ existe em várias redes, e é gente diferente em cada uma.
          </p>
        </fieldset>
      )}

      <p className="hint" id="dica">
        <i className="bi bi-info-circle" aria-hidden="true" />
        <span id="dica-txt">
          {arrastando
            ? 'Pode soltar aqui.'
            : 'Pode arrastar o print ou a foto do anúncio para cá.'}
        </span>
      </p>

      {anexos.length > 0 && (
        <div className="files" id="anexos">
          {anexos.map((a) => (
            <span className="file" key={a.id}>
              <i className="bi bi-file-earmark-image" aria-hidden="true" />
              <span className="nome">{a.nome}</span>
              <span className="peso">{tamanhoLegivel(a.tamanho)}</span>
              <button type="button" onClick={() => tirar(a.id)}
                      aria-label={`Tirar ${a.nome}`}>
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="actions">
        <button className="btn btn--ghost" type="button"
                onClick={() => entradaArquivo.current?.click()}>
          <i className="bi bi-cloud-arrow-up" aria-hidden="true" /> Uploads
        </button>
        <button className="btn btn--primary" type="submit">
          <i className="bi bi-search" aria-hidden="true" /> Verificar
        </button>
      </div>

      {recado && (
        <div className={`status status--${recado.tipo} aberto`} role="status" aria-live="polite">
          <i
            className={`bi ${
              recado.tipo === 'erro' ? 'bi-exclamation-circle-fill'
              : recado.tipo === 'espera' ? 'bi-cone-striped'
              : 'bi-info-circle-fill'
            }`}
            aria-hidden="true"
          />
          <p>{recado.texto}</p>
        </div>
      )}
    </form>
  );
}

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

   CUIDADO AO MEXER:
     - O motor de verificação (Etapa 8) ainda não existe. Enquanto
       não existir, este componente diz isso com todas as letras.
       NÃO invente um resultado de mentira aqui: um site antigolpe
       mostrando análise falsa é exatamente o que ele combate.
   ============================================================= */

import { useState, useRef, useCallback } from 'react';

type Anexo = { id: string; nome: string; tamanho: number };

const LIMITE_ARQUIVOS = 5;
const LIMITE_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo

function tamanhoLegivel(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function Verificador() {
  const [alvo, setAlvo] = useState('');
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

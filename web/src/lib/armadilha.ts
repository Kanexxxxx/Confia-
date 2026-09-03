/* =============================================================
   confiia.com.br — a armadilha para robô

   Dois formulários deste site gravam no banco SEM exigir conta:
   /denunciar e /registrar-loja. Isso é uma decisão de produto —
   quem acabou de perder dinheiro não vai criar cadastro para
   avisar — e o preço dela é um alvo aberto para automação.

   O limite por IP já existe e resolve o caso do volume. Não
   resolve o caso do robô paciente: um script que manda uma
   denúncia por hora, de IPs diferentes, passa por ele.

   ─────────────────────────────────────────────────────────────
   POR QUE NÃO CAPTCHA

   Três razões, nesta ordem:

     1. Captcha castiga justamente quem este site existe para
        proteger. Pessoa de 70 anos com a vista ruim erra o
        "selecione os semáforos" e desiste — e desistir aqui
        significa uma denúncia a menos e um golpista a mais no ar.

     2. Todo captcha conhecido entrega o IP de cada visitante a um
        terceiro (Google, Cloudflare). Nossa Política promete o
        contrário.

     3. Robô moderno resolve captcha por alguns centavos. Ele
        atrapalha mais gente do que robô.

   ─────────────────────────────────────────────────────────────
   O QUE FAZEMOS NO LUGAR — DUAS PERGUNTAS QUE SÓ ROBÔ ERRA

   1. O CAMPO ISCA. Um campo escondido com nome atraente
      ("website"). Pessoa nenhuma o vê nem o preenche. Robô que
      preenche formulário por varredura preenche tudo que
      encontra — e se entrega.

   2. O RELÓGIO. Um carimbo de quando o formulário foi aberto.
      Ninguém lê nove opções, escreve um relato de trinta letras
      e envia em menos de três segundos. Robô envia em
      milissegundos.

   Nenhuma das duas para um atacante decidido que estude o
   formulário. As duas param varredura automática, que é 99% do
   que chega — e custam ZERO para quem é gente.

   ─────────────────────────────────────────────────────────────
   CUIDADO AO MEXER:
     - O campo isca NÃO pode usar `display:none` no CSS de fora:
       robô que carrega o CSS reconhece. Ele é escondido no
       próprio elemento e marcado `aria-hidden` + `tabIndex={-1}`,
       para leitor de tela e teclado também pularem.
     - NUNCA diga ao robô que ele caiu na armadilha. A resposta é
       a mesma de um envio válido — se avisarmos, o autor conserta
       o script. Por isso `pareceRobo` devolve um "sucesso" falso.
     - O carimbo é assinado. Sem assinatura, o robô mandaria um
       carimbo velho e passaria.
   ============================================================= */

/* `server-only` faz o build QUEBRAR se este arquivo for importado
   por um componente de cliente. Não é zelo: já aconteceu. O
   `CamposArmadilha` chamava `carimboDeAgora()` de dentro de um
   arquivo `'use client'`, e o carimbo passou a ser assinado no
   NAVEGADOR — onde `process.env.COFRE_CHAVE` não existe e a
   assinatura caía na constante de reserva, que é pública. Uma
   armadilha com chave conhecida não é armadilha.
   Ver `components/campos-armadilha.tsx`: o carimbo vem por
   propriedade, pronto do servidor. */
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Tempo mínimo entre abrir e enviar. Abaixo disso, é robô. */
const SEGUNDOS_MINIMOS = 3;

/** Depois disso o carimbo vence: um formulário aberto ontem e
 *  enviado hoje é sinal de script guardando páginas. */
const SEGUNDOS_MAXIMOS = 60 * 60 * 6;

function segredo(): string {
  /* Reaproveita a chave do cofre. Não é dado sigiloso de pessoa
     nenhuma — é só para o carimbo não poder ser forjado.

     Em produção ela é obrigatória: sem chave, qualquer um assina
     o próprio carimbo e a armadilha vira enfeite. Em
     desenvolvimento a reserva evita travar quem clonou o projeto
     e ainda não gerou a chave. */
  const chave = process.env.COFRE_CHAVE;
  if (chave) return chave;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('COFRE_CHAVE ausente: a armadilha para robô não pode ser assinada.');
  }
  return 'sem-chave-em-desenvolvimento';
}

function assina(valor: string): string {
  return createHmac('sha256', segredo()).update(valor).digest('base64url');
}

/** Carimbo do momento em que o formulário foi montado. */
export function carimboDeAgora(): string {
  const agora = String(Date.now());
  return `${agora}.${assina(agora)}`;
}

/**
 * O envio parece de robô?
 *
 * Devolve `true` se a isca foi preenchida, ou se o carimbo está
 * ausente, adulterado, rápido demais ou velho demais.
 */
export function pareceRobo(form: FormData): boolean {
  /* --- 1. a isca --- */
  const isca = String(form.get('website') ?? '').trim();
  if (isca) return true;

  /* --- 2. o carimbo --- */
  const carimbo = String(form.get('carimbo') ?? '');
  const [instante, assinatura] = carimbo.split('.');
  if (!instante || !assinatura) return true;

  const esperada = assina(instante);
  /* `timingSafeEqual` e não `===`: comparar assinatura com
     igualdade vaza, pelo tempo, quantos caracteres batem. */
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return true;

  const decorrido = (Date.now() - Number(instante)) / 1000;
  if (!Number.isFinite(decorrido)) return true;
  if (decorrido < SEGUNDOS_MINIMOS) return true;
  if (decorrido > SEGUNDOS_MAXIMOS) return true;

  return false;
}

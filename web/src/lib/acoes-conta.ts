'use server';

/* =============================================================
   confiia.com.br — AÇÕES DE CONTA

   Criar conta, entrar, sair, confirmar e-mail, trocar senha.
   Tudo roda NO SERVIDOR — o navegador só manda o formulário.

   DUAS REGRAS QUE ATRAVESSAM O ARQUIVO INTEIRO:

   1. NÃO CONTAMOS QUEM TEM CONTA AQUI.
      "E-mail ou senha errados" — nunca "este e-mail não existe".
      Se a mensagem mudasse, qualquer pessoa poderia testar uma
      lista de e-mails e descobrir quem é cliente nosso. Num
      serviço antigolpe isso é pior ainda: a lista de quem já foi
      vítima tem valor para quem aplica golpe.

      O mesmo vale ao criar conta e ao pedir nova senha: a resposta
      é idêntica exista o e-mail ou não.

   2. TEMPO CONSTANTE.
      Não basta a mensagem ser igual; a demora também. Por isso
      `conferaSenha(senha, null)` gasta o mesmo tempo de uma
      conferência de verdade quando a conta não existe.

   CUIDADO AO MEXER:
     - Trocar senha SEMPRE derruba todas as sessões. Sem isso, a
       troca não expulsa quem invadiu — e trocar a senha vira
       teatro.
     - Toda ação relevante grava em `auditoria`.
   ============================================================= */

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contas } from '@/db/schema';
import { guardaSenha, conferaSenha, criticaSenha, RECADO_SENHA } from '@/lib/senha';
import { criaSessao, encerraSessao, encerraTodasSessoes, tocaUltimoAcesso } from '@/lib/sessao';
import { criaToken, usaToken } from '@/lib/tokens';
import { confereLimite, zeraLimite, ipDeQuemChama } from '@/lib/limite';
import { registra } from '@/lib/auditoria';
import { env } from '@/lib/env';
import { cnpjValido, soNumeros } from '@/lib/documento';
import {
  mandaVerificarEmail, mandaTrocarSenha, mandaSenhaTrocada, mandaBoasVindas,
} from '@/lib/email';

/* Formato do retorno para o `useActionState` das telas. */
export type Estado = {
  erro?: string;
  campo?: 'nome' | 'apelido' | 'email' | 'senha' | 'telefone' | 'cnpj' | 'geral';
  ok?: string;
} | null;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function limpaEmail(v: FormDataEntryValue | null) {
  return String(v ?? '').trim().toLowerCase();
}

/* =============================================================
   CRIAR CONTA
   ============================================================= */
export async function criarConta(_anterior: Estado, form: FormData): Promise<Estado> {
  const nome = String(form.get('nome') ?? '').trim();
  const email = limpaEmail(form.get('email'));
  const senha = String(form.get('senha') ?? '');
  const aceite = form.get('aceite') === 'on';

  /* Pessoa física ou empresa. Muda o caminho depois do cadastro:
     empresa vai para o fluxo de CNPJ e prova de posse do domínio. */
  const tipo = form.get('tipo') === 'juridica' ? 'juridica' : 'fisica';

  /* Como a pessoa quer ser chamada na tela. Vazio = o banco usa o
     primeiro nome (gatilho tg_apelido em 009). */
  const apelido = String(form.get('apelido') ?? '').trim() || null;

  /* Figura escolhida da lista. NUNCA um caminho de arquivo: não
     existe upload de foto de perfil neste produto. */
  const avatarBruto = String(form.get('avatar') ?? 'inicial');
  const avatar = /^[a-z][a-z0-9-]{0,23}$/.test(avatarBruto) ? avatarBruto : 'inicial';

  /* Só os números. O banco também limpa (gatilho tg_limpa_telefone),
     mas validar aqui dá mensagem melhor que erro de banco. */
  const telefone = soNumeros(String(form.get('telefone') ?? '')) || null;

  /* CNPJ só para empresa. É dado PÚBLICO (a Receita publica), então
     guardar não cria risco novo — e é o que sustenta o selo.
     CPF é outra história: nunca entra aqui. Vai direto para o Asaas
     no checkout, e do nosso lado ficam só os 4 últimos dígitos. */
  const cnpj = tipo === 'juridica' ? soNumeros(String(form.get('cnpj') ?? '')) : null;

  if (nome.length < 2) return { erro: 'Diga seu nome.', campo: 'nome' };
  if (tipo === 'fisica' && !nome.includes(' ')) {
    return { erro: 'Escreva o nome completo — nome e sobrenome.', campo: 'nome' };
  }
  if (!EMAIL_VALIDO.test(email)) return { erro: 'Confira o e-mail: parece estar incompleto.', campo: 'email' };

  const problema = criticaSenha(senha, email);
  if (problema) return { erro: RECADO_SENHA[problema], campo: 'senha' };

  /* Telefone: opcional para pessoa física, obrigatório para empresa.
     A regra também está no banco (CHECK em 008_pessoa.sql) — aqui é
     só para a mensagem ser gentil. */
  if (tipo === 'juridica') {
    if (!cnpj) {
      return { erro: 'Para conta de empresa, o CNPJ é obrigatório — é ele que comprova que a empresa existe.', campo: 'cnpj' };
    }
    if (!cnpjValido(cnpj)) {
      return { erro: 'Este CNPJ não é válido. Confira os números — costuma ser um dígito trocado.', campo: 'cnpj' };
    }
  }

  if (tipo === 'juridica' && (!telefone || telefone.length < 10)) {
    return { erro: 'Para empresa o telefone é obrigatório — é o contato que aparece no seu cadastro.', campo: 'telefone' };
  }
  if (telefone && (telefone.length < 10 || telefone.length > 11)) {
    return { erro: 'Confira o telefone: com DDD, são 10 ou 11 números.', campo: 'telefone' };
  }

  if (!aceite) {
    return { erro: 'Para criar a conta você precisa aceitar os termos e a política.', campo: 'geral' };
  }

  const limite = await confereLimite('criar_conta', email);
  if (!limite.pode) return { erro: limite.recado, campo: 'geral' };

  const senhaHash = await guardaSenha(senha);

  /* Já existe? A resposta ao usuário é a MESMA dos dois lados.
     Quem já tem conta recebe um e-mail avisando disso, em vez de
     um erro na tela — assim quem está testando e-mails não
     descobre nada, e o dono da conta fica sabendo. */
  const [existente] = await db
    .select({ id: contas.id, nome: contas.nome, verificado: contas.emailVerificadoEm })
    .from(contas)
    .where(eq(contas.email, email))
    .limit(1);

  if (existente) {
    if (!existente.verificado) {
      /* Conta criada e nunca confirmada: manda o link de novo. */
      const { token } = await criaToken(existente.id, 'verificar_email');
      await mandaVerificarEmail({
        para: email, contaId: existente.id, nome: existente.nome,
        url: `${env.APP_URL}/api/confirmar?t=${token}`,
      });
    }
    redirect('/confirmar?enviado=1');
  }

  const [nova] = await db
    .insert(contas)
    .values({
      nome,
      email,
      senhaHash,
      apelido,
      avatar,
      telefone,
      cnpj,
      tipoPessoa: tipo,
      aceitouTermosEm: new Date(),
      aceitouTermosVersao: '1.0',
    })
    .returning({ id: contas.id });

  await registra({
    ator: nova.id, acao: 'conta.criar', alvoTipo: 'conta', alvoId: nova.id,
    /* Não gravamos o telefone na auditoria: ela é lida por gente e
       fica anos guardada. Registra QUE mudou, não o dado. */
    depois: { nome, email, tipo, temTelefone: Boolean(telefone), cnpj },
    ip: await ipDeQuemChama(),
  });

  const { token } = await criaToken(nova.id, 'verificar_email');
  await mandaVerificarEmail({
    para: email, contaId: nova.id, nome,
    url: `${env.APP_URL}/api/confirmar?t=${token}`,
  });

  redirect('/confirmar?enviado=1');
}

/* =============================================================
   ENTRAR
   ============================================================= */
export async function entrar(_anterior: Estado, form: FormData): Promise<Estado> {
  const email = limpaEmail(form.get('email'));
  const senha = String(form.get('senha') ?? '');
  const paraOnde = String(form.get('destino') ?? '/conta');

  if (!email || !senha) return { erro: 'Preencha o e-mail e a senha.', campo: 'geral' };

  const limite = await confereLimite('entrar', email);
  if (!limite.pode) return { erro: limite.recado, campo: 'geral' };

  const [conta] = await db
    .select({
      id: contas.id, nome: contas.nome, senhaHash: contas.senhaHash,
      status: contas.status, verificadoEm: contas.emailVerificadoEm,
      excluidaEm: contas.excluidaEm,
      totpAtivadoEm: contas.totpAtivadoEm,
    })
    .from(contas)
    .where(eq(contas.email, email))
    .limit(1);

  /* Mesmo sem conta, gastamos o tempo da conferência. */
  const { certa, precisaRegravar } = await conferaSenha(senha, conta?.senhaHash ?? null);

  if (!conta || !certa || conta.excluidaEm) {
    await registra({
      acao: 'conta.entrar_negado', alvoTipo: 'email', alvoId: email,
      depois: { motivo: !conta ? 'sem conta' : 'senha errada' },
      ip: await ipDeQuemChama(),
    });
    return { erro: 'E-mail ou senha errados.', campo: 'geral' };
  }

  if (conta.status === 'suspensa') {
    return {
      erro: 'Esta conta está suspensa. Escreva para suporte@confiia.com.br para entender o motivo.',
      campo: 'geral',
    };
  }

  if (!conta.verificadoEm) {
    return {
      erro: 'Falta confirmar seu e-mail. Procure a mensagem que enviamos — inclusive no spam.',
      campo: 'geral',
    };
  }

  /* Aproveita que a senha está em mãos para atualizar o custo, se
     ele tiver mudado desde o cadastro. */
  if (precisaRegravar) {
    await db.update(contas).set({ senhaHash: await guardaSenha(senha) }).where(eq(contas.id, conta.id));
  }

  /* ---- SEGUNDO FATOR ----
     Com 2FA ligado, acertar a senha NÃO entra: cria uma sessão
     pela metade, que não dá acesso a nada e morre em 10 minutos.
     Só o código do celular a transforma em sessão de verdade. */
  if (conta.totpAtivadoEm) {
    await criaSessao(conta.id, true);
    redirect('/entrar/codigo');
  }

  await zeraLimite('entrar', email);
  await criaSessao(conta.id);
  await tocaUltimoAcesso(conta.id);
  await registra({
    ator: conta.id, acao: 'conta.entrar', alvoTipo: 'conta', alvoId: conta.id,
    ip: await ipDeQuemChama(),
  });

  /* Só aceita destino interno: sem isto, um link com
     ?destino=https://site-de-golpe levaria a pessoa para fora
     logo depois de entrar. */
  redirect(paraOnde.startsWith('/') && !paraOnde.startsWith('//') ? paraOnde : '/conta');
}

/* =============================================================
   SAIR
   ============================================================= */
export async function sair() {
  await encerraSessao();
  redirect('/entrar');
}

/* =============================================================
   CONFIRMAR E-MAIL
   ============================================================= */
export async function confirmarEmail(token: string) {
  const r = await usaToken(token, 'verificar_email');
  if (!r.ok) return r;

  const [conta] = await db
    .update(contas)
    .set({ emailVerificadoEm: new Date() })
    .where(eq(contas.id, r.contaId))
    .returning({ id: contas.id, nome: contas.nome, email: contas.email });

  await registra({
    ator: conta.id, acao: 'conta.email_confirmado', alvoTipo: 'conta', alvoId: conta.id,
  });

  await mandaBoasVindas({ para: conta.email, contaId: conta.id, nome: conta.nome });

  /* Já entra: a pessoa acabou de provar que o e-mail é dela. */
  await criaSessao(conta.id);
  return { ok: true as const, contaId: conta.id, destino: null };
}

/* =============================================================
   ESQUECI A SENHA
   ============================================================= */
export async function pedirNovaSenha(_anterior: Estado, form: FormData): Promise<Estado> {
  const email = limpaEmail(form.get('email'));
  if (!EMAIL_VALIDO.test(email)) return { erro: 'Confira o e-mail.', campo: 'email' };

  const limite = await confereLimite('esqueci_senha', email);
  if (!limite.pode) return { erro: limite.recado, campo: 'geral' };

  const [conta] = await db
    .select({ id: contas.id, nome: contas.nome, excluidaEm: contas.excluidaEm })
    .from(contas)
    .where(eq(contas.email, email))
    .limit(1);

  if (conta && !conta.excluidaEm) {
    const { token } = await criaToken(conta.id, 'trocar_senha');
    await mandaTrocarSenha({
      para: email, contaId: conta.id, nome: conta.nome,
      url: `${env.APP_URL}/nova-senha?t=${token}`,
    });
    await registra({
      ator: conta.id, acao: 'conta.senha_esquecida', alvoTipo: 'conta', alvoId: conta.id,
      ip: await ipDeQuemChama(),
    });
  }

  /* Mesma resposta com ou sem conta. */
  return {
    ok:
      'Se existir uma conta com esse e-mail, o link já está a caminho. ' +
      'Ele vale por 1 hora — procure também no spam.',
  };
}

/* =============================================================
   DEFINIR A NOVA SENHA
   ============================================================= */
export async function definirNovaSenha(_anterior: Estado, form: FormData): Promise<Estado> {
  const token = String(form.get('token') ?? '');
  const senha = String(form.get('senha') ?? '');
  const repetida = String(form.get('repetida') ?? '');

  const problema = criticaSenha(senha);
  if (problema) return { erro: RECADO_SENHA[problema], campo: 'senha' };
  if (senha !== repetida) return { erro: 'As duas senhas não são iguais.', campo: 'senha' };

  const r = await usaToken(token, 'trocar_senha');
  if (!r.ok) {
    const recados = {
      invalido: 'Este link não é válido. Peça um novo.',
      expirado: 'Este link já passou de 1 hora. Peça um novo.',
      usado: 'Este link já foi usado. Se não foi você, peça um novo agora.',
    };
    return { erro: recados[r.motivo], campo: 'geral' };
  }

  const [conta] = await db
    .update(contas)
    .set({ senhaHash: await guardaSenha(senha), emailVerificadoEm: new Date() })
    .where(eq(contas.id, r.contaId))
    .returning({ id: contas.id, nome: contas.nome, email: contas.email });

  /* Derruba TUDO. Se alguém tinha invadido, sai agora. */
  await encerraTodasSessoes(conta.id);

  await registra({
    ator: conta.id, acao: 'conta.senha_trocada', alvoTipo: 'conta', alvoId: conta.id,
    ip: await ipDeQuemChama(),
  });

  await mandaSenhaTrocada({ para: conta.email, contaId: conta.id, nome: conta.nome });

  redirect('/entrar?trocou=1');
}

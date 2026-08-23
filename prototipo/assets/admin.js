/* =============================================================
   confiia.com.br — comportamento do painel administrativo
   Usado por: admin.html (junto com assets/admin.css)

   COMO ISTO VIRA PRODUÇÃO:
   Tudo que a tela mostra sai do objeto DADOS logo abaixo. Ele foi
   escrito com os MESMOS nomes de campo das views do banco, então
   trocar por rede é substituir o carregador:

       DADOS.fila      →  GET /api/admin/fila       (v_fila_admin)
       DADOS.contas    →  GET /api/admin/contas     (v_conta_completa)
       DADOS.empresas  →  GET /api/admin/empresas   (empresas + dominios)
       DADOS.politica  →  GET /api/admin/politica   (politica_moderacao)
       DADOS.orcamento →  GET /api/admin/orcamento  (orcamento)
       DADOS.servicos  →  GET /api/admin/custos     (v_custo_servico_mes)

   O resto do arquivo (render, filtros, gaveta) continua igual.

   CUIDADO AO MEXER:
     - `AGORA` está fixo para o protótipo ficar estável. Em produção
       vira new Date(). Se trocar, os prazos e os "há X dias" mudam.
     - A trava de identidade (bloqueiaDeferir) precisa existir também
       no servidor. Trava só de tela não trava nada: quem souber
       chamar a API passa por cima. Ver 007_admin.sql.
   ============================================================= */

(function () {
'use strict';

/* Data de referência do protótipo. Em produção: new Date(). */
var AGORA = new Date('2026-08-22T14:30:00');

var DIA = 86400000;

/* =============================================================
   1. DADOS DE EXEMPLO

   Alvos, empresas e pessoas aqui são INVENTADOS de propósito.
   Nunca coloque domínio ou empresa real como exemplo de golpe
   numa tela — mesmo interna, print vaza e vira acusação.
   ============================================================= */

var DADOS = {

  /* --- politica_moderacao (005_moderacao.sql + 007_admin.sql) ---
     A tela nunca inventa regra. Ela mostra a linha que já está
     escrita no banco. Se falta regra para um caso, o certo é criar
     a linha lá, não decidir no impulso aqui.                    */
  politica: {
    'dono_sem_denuncia': {
      situacao: 'dono comprova o site e não há denúncia',
      exige: 'Prova de posse do domínio (DNS TXT ou e-mail do próprio domínio) + CNPJ ativo',
      decisao: 'Reanalisar. Se os indícios eram só idade do domínio e dados ocultos, subir o score e convidar para o cadastro de empresa verificada.',
      prazo_dias: 7
    },
    'dono_com_denuncia': {
      situacao: 'dono comprova o site mas há denúncia de usuário',
      exige: 'Prova de posse + resposta ponto a ponto às denúncias',
      decisao: 'Manter o registro das denúncias, publicar a versão da empresa junto e reanalisar. Não removemos relato de consumidor sem prova de que é falso.',
      prazo_dias: 7
    },
    'erro_tecnico': {
      situacao: 'empresa alega erro na análise técnica',
      exige: 'Indicar qual item está errado',
      decisao: 'Conferir o item. Estando errado, corrigir, registrar a correção e responder explicando.',
      prazo_dias: 7
    },
    'lgpd_titular': {
      situacao: 'titular pede exclusão de dado pessoal (LGPD)',
      exige: 'Confirmação de identidade do titular',
      decisao: 'Excluir o dado pessoal em até 15 dias. O alvo denunciado, quando não for dado pessoal, permanece.',
      prazo_dias: 15
    },
    'sem_identidade': {
      situacao: 'pedido sem comprovação de identidade',
      exige: 'Nada apresentado',
      decisao: 'Não decidir. Solicitar comprovação e aguardar. Sem resposta em 15 dias, arquivar.',
      prazo_dias: 15
    },
    'judicial': {
      situacao: 'ordem judicial',
      exige: 'Ofício ou decisão judicial',
      decisao: 'Cumprir no prazo determinado, registrar e comunicar quem publicou, quando permitido.',
      prazo_dias: 2
    },
    'suspeita_golpista': {
      situacao: 'suspeita de golpista pedindo limpeza de ficha',
      exige: 'Qualquer prova apresentada não confere com dados públicos',
      decisao: 'Indeferir, registrar a tentativa e manter tudo. Reincidência: bloquear o e-mail solicitante.',
      prazo_dias: 7
    },
    /* acrescentadas em 007_admin.sql */
    'denuncia_comum': {
      situacao: 'denúncia de consumidor sobre alvo já conhecido',
      exige: 'Relato com data, valor e ao menos uma prova (print, comprovante ou B.O.)',
      decisao: 'Confirmar quando o relato bate com os indícios técnicos do alvo. Sem prova nenhuma, manter como "nova" e pedir complemento — não recusar de cara, e não confirmar de cara.',
      prazo_dias: 7
    },
    'denuncia_golpe_novo': {
      situacao: 'denúncia marcada como golpe novo',
      exige: 'Descrição do que foi diferente',
      decisao: 'Analisar em até 2 dias. Confirmado, abrir a linha em golpes_conhecidos com o roteiro e vincular as denúncias parecidas. É isso que protege a próxima pessoa.',
      prazo_dias: 2
    },
    'empresa_cadastro': {
      situacao: 'empresa pedindo cadastro',
      exige: 'CNPJ ativo na Receita + posse comprovada de pelo menos uma propriedade',
      decisao: 'Sem posse comprovada, só o nível "registrada". O selo "verificada" exige DNS TXT, arquivo no domínio ou e-mail do próprio domínio.',
      prazo_dias: 7
    }
  },

  /* --- v_fila_admin --- */
  fila: [
    {
      fila: 'golpe_novo', id: 'a1f3', referencia: 'DN-8f3a21',
      assunto: 'Falso resgate de conta de jogo',
      alvo: 'recupera-conta-jogo.click',
      criada_em: '2026-08-21T22:10:00',
      prazo_dias: 2,
      regra: 'denuncia_golpe_novo',
      categoria: 'jogo',
      prejuizo_cent: 124000,
      anonima: false,
      denunciante: 'Vitória A.',
      relato: 'Recebi mensagem dizendo que minha conta tinha sido invadida e que eu precisava validar em um link pra não perder os itens. A página era idêntica à oficial. Coloquei login e o código do celular. Em dois minutos perdi a conta e todas as skins.',
      descricao_novo: 'O diferente é que eles não pediram dinheiro. Pediram o código do SMS dizendo que era pra CANCELAR a invasão. Depois venderam minha conta e meu amigo comprou sem saber que era roubada.',
      provas: [
        { tipo: 'print_conversa', nome: 'conversa-suporte-falso.png', bytes: '412 KB' },
        { tipo: 'pagina', nome: 'pagina-login-copia.png', bytes: '780 KB' },
        { tipo: 'boletim_ocorrencia', nome: 'bo-2026-114552.pdf', bytes: '96 KB' }
      ],
      semelhantes: 0
    },
    {
      fila: 'contestacao', id: 'b2c4', referencia: 'CT-2026-000112',
      assunto: 'remocao',
      alvo: 'kazaverde-decoracoes.com.br',
      criada_em: '2026-08-13T09:20:00',
      prazo_dias: 7,
      regra: 'dono_sem_denuncia',
      solicitante_nome: 'Marina Toledo',
      solicitante_email: 'marina@kazaverde-decoracoes.com.br',
      relacao: 'dono',
      identidade_confirmada: true,
      metodo_identidade: 'dns_txt',
      alegacao: 'Abri minha loja em maio. Quando alguém pesquisa meu site aparece "domínio recém-criado" e "dados do dono ocultos", e a pessoa desiste de comprar. Os dados estão ocultos porque o registro.br esconde CPF por padrão, não porque eu escondi.',
      score_antes: 62,
      denuncias_no_alvo: 0,
      cnpj_situacao: 'ATIVA',
      anexos: [
        { tipo: 'contrato_social', nome: 'contrato-social.pdf', bytes: '1,2 MB' },
        { tipo: 'prova_dns', nome: 'registro-dns-txt.txt', bytes: '1 KB' }
      ]
    },
    {
      fila: 'denuncia', id: 'c3d5', referencia: 'DN-4b1c9e',
      assunto: 'emprestimo',
      alvo: 'credito-liberado-agora.site',
      criada_em: '2026-08-14T18:45:00',
      prazo_dias: 7,
      regra: 'denuncia_comum',
      categoria: 'emprestimo',
      prejuizo_cent: 89000,
      anonima: true,
      denunciante: null,
      relato: 'Aprovaram um empréstimo de R$ 8.000 sem consulta nenhuma. Só pediram R$ 890 de "taxa de liberação" por Pix. Paguei, mandaram um comprovante de transferência que nunca caiu, e depois pediram mais R$ 400 de "desbloqueio". Aí eu entendi.',
      provas: [
        { tipo: 'comprovante', nome: 'pix-890.pdf', bytes: '64 KB' },
        { tipo: 'comprovante', nome: 'comprovante-falso-deles.jpg', bytes: '318 KB' },
        { tipo: 'boletim_ocorrencia', nome: 'bo-2026-109877.pdf', bytes: '88 KB' }
      ],
      semelhantes: 6
    },
    {
      fila: 'empresa', id: 'd4e6', referencia: 'Norte Peças Automotivas',
      assunto: 'cadastro',
      alvo: '41.882.330/0001-07',
      criada_em: '2026-08-17T11:05:00',
      prazo_dias: 7,
      regra: 'empresa_cadastro',
      empresa_ref: 'norte'
    },
    {
      fila: 'denuncia', id: 'e5f7', referencia: 'DN-7d20a1',
      assunto: 'jogo',
      alvo: 'skinsdrop-premios.site',
      criada_em: '2026-08-17T20:12:00',
      prazo_dias: 7,
      regra: 'denuncia_comum',
      categoria: 'jogo',
      prejuizo_cent: 32000,
      anonima: true,
      denunciante: null,
      relato: 'Site de sorteio de skin. Depositei R$ 320 em três vezes, ganhei uma skin cara na roleta e na hora de sacar apareceu que eu precisava depositar mais R$ 500 pra "liberar o saque". O suporte some depois disso.',
      provas: [{ tipo: 'print_conversa', nome: 'suporte-sumiu.png', bytes: '240 KB' }],
      semelhantes: 11
    },
    {
      fila: 'contestacao', id: 'f6a8', referencia: 'CT-2026-000117',
      assunto: 'remocao',
      alvo: 'promo-eletro-oficial.shop',
      criada_em: '2026-08-20T15:40:00',
      prazo_dias: 7,
      regra: 'suspeita_golpista',
      solicitante_nome: 'Departamento Jurídico',
      solicitante_email: 'juridico.oficial@gmail.com',
      relacao: 'representante',
      identidade_confirmada: false,
      metodo_identidade: null,
      alegacao: 'Solicitamos a remoção imediata da avaliação sobre nosso domínio, sob pena das medidas judiciais cabíveis. Temos 48 horas de prazo.',
      score_antes: 21,
      denuncias_no_alvo: 14,
      cnpj_situacao: null,
      anexos: [],
      sinais_contra: [
        'E-mail do solicitante é gratuito, não é do domínio contestado',
        'Nenhum documento anexado até agora',
        'Domínio tem 22 dias de idade e 14 denúncias confirmadas',
        'Mesmo texto já recebido em outros 2 domínios diferentes'
      ]
    },
    {
      fila: 'contestacao', id: 'a7b9', referencia: 'CT-2026-000119',
      assunto: 'lgpd',
      alvo: 'print anexado na denúncia DN-3c88f1',
      criada_em: '2026-08-20T08:30:00',
      prazo_dias: 15,
      regra: 'lgpd_titular',
      solicitante_nome: 'Rafael Menezes',
      solicitante_email: 'rafael.menezes@outlook.com',
      relacao: 'titular_dado',
      identidade_confirmada: true,
      metodo_identidade: 'documento',
      alegacao: 'Meu nome e meu número aparecem no print que outra pessoa enviou. Eu não tenho nada a ver com o golpe, era um grupo de vendas. Quero meus dados apagados.',
      score_antes: null,
      denuncias_no_alvo: 1,
      cnpj_situacao: null,
      anexos: [{ tipo: 'documento', nome: 'documento-identidade.pdf', bytes: '540 KB' }]
    },
    {
      fila: 'contestacao', id: 'b8c1', referencia: 'CT-2026-000120',
      assunto: 'correcao',
      alvo: 'brunadoces.com.br',
      criada_em: '2026-08-21T10:15:00',
      prazo_dias: 7,
      regra: 'erro_tecnico',
      solicitante_nome: 'Bruna Salgado',
      solicitante_email: 'contato@brunadoces.com.br',
      relacao: 'dono',
      identidade_confirmada: true,
      metodo_identidade: 'email_do_dominio',
      alegacao: 'A análise diz que meu site não tem certificado de segurança. Ele tem, e é válido até 2027. Acho que vocês testaram sem o www e meu servidor só responde com www.',
      score_antes: 71,
      denuncias_no_alvo: 0,
      cnpj_situacao: 'ATIVA',
      anexos: [{ tipo: 'outro', nome: 'print-certificado.png', bytes: '180 KB' }]
    },
    {
      fila: 'empresa', id: 'c9d2', referencia: 'TechFix Assistência',
      assunto: 'cadastro',
      alvo: '55.104.772/0001-45',
      criada_em: '2026-08-21T16:50:00',
      prazo_dias: 7,
      regra: 'empresa_cadastro',
      empresa_ref: 'techfix'
    },
    {
      fila: 'denuncia', id: 'd1e3', referencia: 'DN-9a4f60',
      assunto: 'perfil',
      alvo: '@suporte.oficial.pgto',
      criada_em: '2026-08-22T07:20:00',
      prazo_dias: 7,
      regra: 'denuncia_comum',
      categoria: 'perfil',
      prejuizo_cent: 0,
      anonima: true,
      denunciante: null,
      relato: 'Perfil novo copiando o nome e a foto de uma empresa de pagamento. Manda mensagem no direct dizendo que houve uma cobrança indevida e pede pra clicar num link pra estornar. Não caí, mas quase.',
      provas: [{ tipo: 'print_conversa', nome: 'direct.png', bytes: '150 KB' }],
      semelhantes: 3
    }
  ],

  /* --- v_conta_completa --- */
  contas: [
    { id:'11a2', nome:'Marina Toledo',    email:'marina@kazaverde-decoracoes.com.br', telefone:'(11) 98812-4477',
      plano:'premium',    status:'ativa',    status_assinatura:'ativa',   proxima_cobranca:'2026-09-08',
      usou_mes:64,  imagens_mes:18, limite_mes:150, criada_em:'2026-03-02', ultimo_acesso_em:'2026-08-22T11:40:00',
      membros:2, total:412 },

    { id:'22b3', nome:'Joaquim Ferreira', email:'joaquim.ferreira58@gmail.com', telefone:'(16) 99120-8845',
      plano:'basico',     status:'ativa',    status_assinatura:'ativa',   proxima_cobranca:'2026-09-14',
      usou_mes:29,  imagens_mes:5,  limite_mes:30,  criada_em:'2026-05-21', ultimo_acesso_em:'2026-08-21T19:05:00',
      membros:1, total:96 },

    { id:'33c4', nome:'Denise Aparecida', email:'deniseap@hotmail.com', telefone:'(21) 97744-1201',
      plano:'basico',     status:'ativa',    status_assinatura:'atrasada', proxima_cobranca:'2026-08-19',
      usou_mes:12,  imagens_mes:2,  limite_mes:30,  criada_em:'2026-06-11', ultimo_acesso_em:'2026-08-20T08:12:00',
      membros:1, total:58 },

    { id:'44d5', nome:'Vitória Amaral',   email:'vitoria.amaral@gmail.com', telefone:'(41) 98003-7719',
      plano:'gratis',     status:'ativa',    status_assinatura:null,      proxima_cobranca:null,
      usou_mes:5,   imagens_mes:0,  limite_mes:5,   criada_em:'2026-08-21', ultimo_acesso_em:'2026-08-22T09:55:00',
      membros:1, total:5 },

    { id:'55e6', nome:'Norte Peças ME',   email:'compras@nortepecas.com.br', telefone:'(47) 3322-8100',
      plano:'enterprise', status:'ativa',    status_assinatura:'teste',   proxima_cobranca:'2026-09-01',
      usou_mes:1180, imagens_mes:220, limite_mes:null, criada_em:'2026-07-04', ultimo_acesso_em:'2026-08-22T13:10:00',
      membros:6, total:3902 },

    { id:'66f7', nome:'Rafael Menezes',   email:'rafael.menezes@outlook.com', telefone:'(31) 99411-2288',
      plano:'gratis',     status:'ativa',    status_assinatura:null,      proxima_cobranca:null,
      usou_mes:2,   imagens_mes:0,  limite_mes:5,   criada_em:'2026-08-19', ultimo_acesso_em:'2026-08-20T08:31:00',
      membros:1, total:2 },

    { id:'77a8', nome:'Sérgio Bastos',    email:'sergiobastos.adm@gmail.com', telefone:'(85) 98120-3344',
      plano:'premium',    status:'suspensa', status_assinatura:'cancelada', proxima_cobranca:null,
      usou_mes:0,   imagens_mes:0,  limite_mes:150, criada_em:'2026-04-16', ultimo_acesso_em:'2026-07-30T22:40:00',
      membros:1, total:640, motivo_suspensao:'Uso automatizado: 600 verificações em 40 minutos por script.' },

    { id:'88b9', nome:'Bruna Salgado',    email:'contato@brunadoces.com.br', telefone:'(19) 99630-5512',
      plano:'basico',     status:'ativa',    status_assinatura:'ativa',   proxima_cobranca:'2026-09-03',
      usou_mes:8,   imagens_mes:1,  limite_mes:30,  criada_em:'2026-06-30', ultimo_acesso_em:'2026-08-21T10:22:00',
      membros:1, total:71 }
  ],

  /* --- empresas + empresa_dominios (004_empresas.sql) --- */
  empresas: [
    { ref:'kaza', nome_fantasia:'Kaza Verde Decorações', razao_social:'Kaza Verde Comércio de Decoração LTDA',
      cnpj:'32.774.109/0001-88', situacao_receita:'ATIVA', abertura:'2026-04-28',
      nivel:'verificada', status:'aprovada', categoria:'decoracao',
      denuncias_90d:0, aprovada_em:'2026-06-02',
      propriedades:[
        { tipo:'site', valor:'kazaverde-decoracoes.com.br', metodo:'dns_txt', confirmada_em:'2026-06-01', principal:true },
        { tipo:'instagram', valor:'@kazaverdedeco', metodo:null, confirmada_em:null, principal:false }
      ] },

    { ref:'norte', nome_fantasia:'Norte Peças Automotivas', razao_social:'Norte Distribuidora de Peças LTDA',
      cnpj:'41.882.330/0001-07', situacao_receita:'ATIVA', abertura:'2019-09-12',
      nivel:null, status:'em_analise', categoria:'automotivo',
      denuncias_90d:0, aprovada_em:null,
      propriedades:[
        { tipo:'site', valor:'nortepecas.com.br', metodo:'dns_txt', confirmada_em:null, principal:true,
          codigo:'confia-verificacao=7f2a9c41e8b03d5a' }
      ] },

    { ref:'techfix', nome_fantasia:'TechFix Assistência', razao_social:'TechFix Serviços em Eletrônicos ME',
      cnpj:'55.104.772/0001-45', situacao_receita:'ATIVA', abertura:'2026-07-30',
      nivel:null, status:'em_analise', categoria:'servico',
      denuncias_90d:1, aprovada_em:null,
      propriedades:[
        { tipo:'site', valor:'techfix-assistencia.shop', metodo:null, confirmada_em:null, principal:true,
          codigo:'confia-verificacao=b41d0e77a2c9f635' },
        { tipo:'whatsapp', valor:'(11) 94002-8922', metodo:null, confirmada_em:null, principal:false }
      ],
      atencao:'CNPJ aberto há 23 dias e o site é .shop criado na mesma semana. Não é prova de golpe, mas é o mesmo perfil de loja que some. Não aprovar acima de "registrada" sem posse confirmada.' },

    { ref:'bruna', nome_fantasia:'Bruna Doces Artesanais', razao_social:'Bruna Salgado Confeitaria ME',
      cnpj:'28.660.415/0001-30', situacao_receita:'ATIVA', abertura:'2024-02-19',
      nivel:'estabelecida', status:'aprovada', categoria:'alimentacao',
      denuncias_90d:0, aprovada_em:'2026-07-08',
      propriedades:[
        { tipo:'site', valor:'brunadoces.com.br', metodo:'email_do_dominio', confirmada_em:'2026-07-07', principal:true }
      ] },

    { ref:'promo', nome_fantasia:'Promo Eletro Oficial', razao_social:null,
      cnpj:null, situacao_receita:null, abertura:null,
      nivel:null, status:'recusada', categoria:'eletronico',
      denuncias_90d:14, aprovada_em:null,
      propriedades:[
        { tipo:'site', valor:'promo-eletro-oficial.shop', metodo:null, confirmada_em:null, principal:true }
      ],
      atencao:'Cadastro recusado em 20/08. Sem CNPJ, sem posse comprovada e com 14 denúncias confirmadas no domínio. Está contestando a recusa pelo protocolo CT-2026-000117.' },

    { ref:'mercearia', nome_fantasia:'Mercearia do Bairro', razao_social:'Mercearia Santa Rita ME',
      cnpj:'19.443.028/0001-61', situacao_receita:'ATIVA', abertura:'2021-11-05',
      nivel:'registrada', status:'aprovada', categoria:'alimentacao',
      denuncias_90d:0, aprovada_em:'2026-08-05',
      propriedades:[
        { tipo:'instagram', valor:'@merceariadobairro', metodo:null, confirmada_em:null, principal:true }
      ],
      atencao:'Só tem Instagram, sem site próprio. Fica em "registrada": conseguimos confirmar que o CNPJ existe e está ativo, mas não que este perfil pertence a ele.' }
  ],

  /* --- orcamento (005_moderacao.sql) --- */
  orcamento: {
    competencia: '2026-08-01',
    teto_cent: 7000,
    gasto_cent: 4183,
    alerta_em_pct: 70,
    travado: false
  },

  /* --- logs_externos agrupado por serviço --- */
  servicos: [
    { servico:'openai',       para:'Ler print e interpretar conteúdo',      chamadas:389, medio_cent:6,  total_cent:2334, falhas:2 },
    { servico:'hive',         para:'Detectar imagem gerada por IA',          chamadas:389, medio_cent:2,  total_cent:778,  falhas:0 },
    { servico:'whois/rdap',   para:'Idade e dono do domínio',                chamadas:1204, medio_cent:1, total_cent:964,  falhas:11 },
    { servico:'safebrowsing', para:'Listas públicas de phishing',            chamadas:1204, medio_cent:0, total_cent:0,    falhas:0 },
    { servico:'resend',       para:'E-mails do sistema',                     chamadas:317, medio_cent:0,  total_cent:0,    falhas:1 },
    { servico:'asaas',        para:'Cobrança e webhook de assinatura',       chamadas:96,  medio_cent:1,  total_cent:107,  falhas:0 }
  ],

  /* --- v_custo_dia --- */
  dias: [
    { dia:'2026-08-22', verificacoes:74,  imagens:19, custo_cent:243 },
    { dia:'2026-08-21', verificacoes:131, imagens:34, custo_cent:418 },
    { dia:'2026-08-20', verificacoes:118, imagens:28, custo_cent:361 },
    { dia:'2026-08-19', verificacoes:96,  imagens:22, custo_cent:290 },
    { dia:'2026-08-18', verificacoes:104, imagens:25, custo_cent:322 },
    { dia:'2026-08-17', verificacoes:88,  imagens:20, custo_cent:266 },
    { dia:'2026-08-16', verificacoes:52,  imagens:9,  custo_cent:138 }
  ],

  /* barras do gráfico: verificações por dia, 14 dias */
  grafico: [55,61,72,58,84,91,52,47,88,104,96,118,131,74],

  /* --- auditoria --- */
  auditoria: [
    { acao:'contestacao.deferir', cor:'ok',
      texto:'<b>CT-2026-000108</b> deferida — score de <b>48</b> para <b>74</b> em ateliedoluar.com.br. Posse confirmada por DNS TXT, nenhuma denúncia no alvo.',
      quando:'há 2 horas' },
    { acao:'empresa.aprovar', cor:'ok',
      texto:'<b>Mercearia do Bairro</b> aprovada no nível <b>registrada</b>. Sem site próprio: perfil de Instagram não comprova posse.',
      quando:'há 5 horas' },
    { acao:'denuncia.confirmar', cor:'risco',
      texto:'<b>DN-3c88f1</b> confirmada — <b>skinsdrop-premios.site</b> caiu para score 14. Décima primeira denúncia no mesmo alvo.',
      quando:'ontem, 18:22' },
    { acao:'conta.suspender', cor:'risco',
      texto:'Conta de <b>Sérgio Bastos</b> suspensa — 600 verificações em 40 minutos por script. Assinatura cancelada sem reembolso, conforme a política de uso.',
      quando:'21/08, 09:14' },
    { acao:'contestacao.indeferir', cor:'risco',
      texto:'<b>CT-2026-000110</b> indeferida — documento apresentado não confere com os dados públicos do CNPJ. Tentativa registrada.',
      quando:'20/08, 16:40' },
    { acao:'dado.revelar', cor:'azul',
      texto:'E-mail da conta <b>Denise Aparecida</b> revelado para atender o ticket <b>#2291</b> sobre cobrança em atraso.',
      quando:'20/08, 10:05' }
  ]
};


/* =============================================================
   2. UTILIDADES
   ============================================================= */

function $(s, raiz) { return (raiz || document).querySelector(s); }
function $$(s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); }

/* Escapa antes de jogar em innerHTML. Relato de vítima é texto de
   terceiro: nunca confie, nem no seu próprio painel. */
function esc(t) {
  if (t === null || t === undefined) return '';
  return String(t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function moeda(cent) {
  return 'R$ ' + (cent / 100).toFixed(2).replace('.', ',');
}

/* Data só com dia (AAAA-MM-DD) não pode passar pelo new Date(): o
   JS lê como meia-noite em UTC e no fuso do Brasil volta um dia.
   Aqui é recorte de texto mesmo. */
function dataCurta(iso) {
  var p = iso.slice(0, 10).split('-');
  return p[2] + '/' + p[1];
}
function dataBR(iso) {
  var p = iso.slice(0, 10).split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

/* "há 9 dias" / "há 4 horas" / "há 12 minutos" */
function desde(iso) {
  var ms = AGORA - new Date(iso);
  var min = Math.floor(ms / 60000);
  if (min < 60) return 'há ' + min + ' min';
  var h = Math.floor(min / 60);
  if (h < 24) return 'há ' + h + (h === 1 ? ' hora' : ' horas');
  var d = Math.floor(h / 24);
  return 'há ' + d + (d === 1 ? ' dia' : ' dias');
}

/* =============================================================
   3. PRAZO

   Toda a fila é medida contra o prazo prometido nos Termos.
   Estourou = você furou a sua própria promessa. Por isso o
   cálculo mora num lugar só.
   ============================================================= */
function calculaPrazo(item) {
  var criada = new Date(item.criada_em);
  var limite = new Date(criada.getTime() + item.prazo_dias * DIA);
  var total = limite - criada;
  var gasto = AGORA - criada;
  var pct = Math.max(2, Math.min(100, Math.round(gasto / total * 100)));
  var restaMs = limite - AGORA;

  var urgencia;
  if (item.fila === 'golpe_novo') urgencia = 'prioridade';
  else if (restaMs < 0) urgencia = 'atrasado';
  else if (restaMs < 2 * DIA) urgencia = 'urgente';
  else urgencia = 'no prazo';

  var legenda;
  if (restaMs < 0) {
    var atraso = Math.ceil(-restaMs / DIA);
    legenda = atraso + (atraso === 1 ? ' dia além do prazo' : ' dias além do prazo');
  } else if (restaMs < DIA) {
    legenda = 'vence em ' + Math.max(1, Math.floor(restaMs / 3600000)) + 'h';
  } else {
    var faltam = Math.floor(restaMs / DIA);
    legenda = (faltam === 1 ? 'falta 1 dia' : 'faltam ' + faltam + ' dias');
  }

  return { pct: pct, urgencia: urgencia, legenda: legenda, limite: limite, esperando: desde(item.criada_em) };
}

var ROTULO_FILA = {
  golpe_novo:  { txt: 'Golpe novo',  classe: 'tipo--golpe' },
  contestacao: { txt: 'Contestação', classe: 'tipo--contestacao' },
  denuncia:    { txt: 'Denúncia',    classe: 'tipo--denuncia' },
  empresa:     { txt: 'Empresa',     classe: 'tipo--empresa' }
};

var ROTULO_ASSUNTO = {
  remocao: 'Pedido de remoção', correcao: 'Pedido de correção',
  direito_resposta: 'Direito de resposta', lgpd: 'Pedido LGPD',
  cadastro: 'Cadastro de empresa',
  loja: 'Loja', jogo: 'Jogo ou skin', emprestimo: 'Empréstimo',
  emprego: 'Vaga de emprego', premio: 'Prêmio', perfil: 'Perfil falso'
};

function chipUrgencia(u) {
  var mapa = {
    'prioridade': ['chip--prioridade', 'bi-lightning-charge-fill', 'prioridade'],
    'atrasado':   ['chip--atrasado',   'bi-exclamation-triangle-fill', 'atrasado'],
    'urgente':    ['chip--urgente',    'bi-clock-fill', 'urgente'],
    'no prazo':   ['chip--prazo',      'bi-check2', 'no prazo']
  };
  var m = mapa[u];
  return '<span class="chip ' + m[0] + '"><i class="bi ' + m[1] + '" aria-hidden="true"></i>' + m[2] + '</span>';
}

/* Cobre dado pessoal. Ver a nota de minimização em admin.html. */
function cobreEmail(e) {
  var p = e.split('@');
  var l = p[0];
  var visivel = l.length > 2 ? l[0] + '•••••' + l[l.length - 1] : l[0] + '•••';
  return visivel + '@' + p[1];
}
function cobreTelefone(t) {
  return t.slice(0, 5) + ' ••••-••' + t.slice(-2);
}


/* =============================================================
   4. TELA 1 — PAINEL
   ============================================================= */

function montaPainel() {
  var fila = DADOS.fila.map(function (i) {
    var p = calculaPrazo(i); i._p = p; return i;
  });

  var atrasados = fila.filter(function (i) { return i._p.urgencia === 'atrasado'; });
  var urgentes  = fila.filter(function (i) { return i._p.urgencia === 'urgente' || i._p.urgencia === 'prioridade'; });
  var noPrazo   = fila.filter(function (i) { return i._p.urgencia === 'no prazo'; });

  var maisVelho = fila.slice().sort(function (a, b) {
    return new Date(a.criada_em) - new Date(b.criada_em);
  })[0];
  var novos = fila.filter(function (i) { return i.fila === 'golpe_novo'; });

  var caixa = '';
  if (novos.length) {
    caixa += '<div style="margin-bottom:10px"><b>' + novos.length +
      (novos.length === 1 ? ' golpe novo' : ' golpes novos') + ' esperando.</b> ' +
      esc(novos[0].assunto) + ' — ' + novos[0]._p.legenda + '.</div>';
  }
  caixa += 'Mais antiga: <b>' + esc(maisVelho.referencia) + '</b> · esperando ' +
    maisVelho._p.esperando.replace('há ', '') + ' · ' + maisVelho._p.legenda + '.';

  $('#destaque-fila').innerHTML =
    '<div class="bloco b-atrasado"><b>' + atrasados.length + '</b><span>atrasados</span></div>' +
    '<div class="bloco b-urgente"><b>' + urgentes.length + '</b><span>urgentes</span></div>' +
    '<div class="bloco b-ok"><b>' + noPrazo.length + '</b><span>no prazo</span></div>' +
    '<div class="mais-velho">' + caixa + '</div>';

  /* --- números-resumo --- */
  var pagantes = DADOS.contas.filter(function (c) {
    return c.status_assinatura === 'ativa' || c.status_assinatura === 'atrasada';
  });
  var receita = pagantes.reduce(function (s, c) {
    return s + (c.plano === 'premium' ? 2490 : c.plano === 'basico' ? 1290 : 0);
  }, 0);

  var tiles = [
    { rot: 'Verificações hoje', ico: 'bi-search', n: DADOS.dias[0].verificacoes,
      pe: '<span class="delta delta--desce">−43%</span> que ontem (dia ainda não acabou)' },
    { rot: 'Contas ativas', ico: 'bi-people', n: DADOS.contas.filter(function (c) { return c.status === 'ativa'; }).length,
      pe: '2 criadas nos últimos 7 dias' },
    { rot: 'Assinantes', ico: 'bi-credit-card', n: pagantes.length,
      pe: '1 com pagamento em atraso' },
    { rot: 'Receita recorrente', ico: 'bi-graph-up', n: moeda(receita),
      pe: 'por mês, sem contar o Enterprise em teste' }
  ];

  $('#stats-painel').innerHTML = tiles.map(function (t) {
    return '<div class="stat">' +
      '<span class="rot"><i class="bi ' + t.ico + '" aria-hidden="true"></i>' + t.rot + '</span>' +
      '<b>' + t.n + '</b><span>' + t.pe + '</span></div>';
  }).join('');

  /* --- gráfico --- */
  var maior = Math.max.apply(null, DADOS.grafico);
  var hoje = DADOS.grafico.length - 1;
  $('#grafico').innerHTML = DADOS.grafico.map(function (v, i) {
    var alt = Math.round(v / maior * 92);
    var d = new Date(AGORA.getTime() - (DADOS.grafico.length - 1 - i) * DIA);
    return '<div class="col' + (i === hoje ? ' hoje' : '') + '" title="' + v + ' verificações">' +
      '<i style="height:' + alt + '%"></i><span>' + d.getDate() + '</span></div>';
  }).join('');

  var soma = DADOS.grafico.reduce(function (a, b) { return a + b; }, 0);
  $('#resumo-grafico').innerHTML =
    '<b style="color:var(--texto)">' + soma.toLocaleString('pt-BR') + '</b> verificações em 14 dias · ' +
    'média de ' + Math.round(soma / 14) + ' por dia · pico em 21/08 com 131.';

  /* --- orçamento --- */
  aplicaMedidor($('#medidor-painel'), DADOS.orcamento, false);

  /* --- auditoria --- */
  $('#trilha-auditoria').innerHTML = DADOS.auditoria.map(function (a) {
    return '<li><span class="pt ' + a.cor + '"></span>' +
      '<span class="oq">' + a.texto + '<br><span class="mono" style="font-size:11px;opacity:.55">' +
      esc(a.acao) + '</span></span>' +
      '<span class="quando">' + esc(a.quando) + '</span></li>';
  }).join('');

  /* --- contadores do trilho --- */
  $('#badge-fila').textContent = fila.length;
  $('#badge-fila').classList.toggle('quente', atrasados.length > 0 || novos.length > 0);
  $('#badge-empresas').textContent = DADOS.empresas.filter(function (e) {
    return e.status === 'em_analise';
  }).length;
}

/* Medidor de orçamento, reaproveitado no painel e na tela de custos.
   Pinta o elemento container (a cor do trilho depende do estado) e
   escreve o conteúdo. Ver .medidor / .medidor.aviso / .medidor.travou
   em admin.css. */
function aplicaMedidor(el, o, detalhado) {
  var pct = Math.min(100, Math.round(o.gasto_cent / o.teto_cent * 100));
  el.className = 'medidor' + (o.travado ? ' travou' : (pct >= o.alerta_em_pct ? ' aviso' : ''));
  el.innerHTML = medidorHTML(o, detalhado);
}

function medidorHTML(o, detalhado) {
  var pct = Math.min(100, Math.round(o.gasto_cent / o.teto_cent * 100));
  var sobrou = o.teto_cent - o.gasto_cent;

  /* dias restantes no mês e projeção simples */
  var fim = new Date(AGORA.getFullYear(), AGORA.getMonth() + 1, 0).getDate();
  var passou = AGORA.getDate();
  var faltam = fim - passou;
  var projecao = Math.round(o.gasto_cent / passou * fim);

  var html =
    '<div class="cabeca"><b>' + moeda(o.gasto_cent) + '</b>' +
    '<span class="de">de ' + moeda(o.teto_cent) + ' · ' + pct + '%</span>' +
    (o.travado ? ' <span class="chip chip--atrasado"><i class="bi bi-pause-fill" aria-hidden="true"></i>travado</span>' : '') +
    '</div>' +
    '<div class="trilho"><i style="width:' + pct + '%"></i>' +
    '<span class="marca" style="left:' + o.alerta_em_pct + '%"></span></div>' +
    '<div class="rodape"><span>sobram ' + moeda(sobrou) + '</span>' +
    '<span>' + faltam + ' dias até virar o mês</span></div>';

  if (detalhado) {
    var estoura = projecao > o.teto_cent;
    html += '<div class="espaco"></div>' +
      '<div class="trava ' + (estoura ? '' : 'trava--ok') + '">' +
      '<i class="bi ' + (estoura ? 'bi-graph-up-arrow' : 'bi-check-circle-fill') + '" aria-hidden="true"></i>' +
      '<p><b>Projeção do mês: ' + moeda(projecao) + '.</b> ' +
      (estoura
        ? 'No ritmo atual o teto estoura antes do dia ' + fim + '. Ou você sobe o teto, ou o sistema trava e passa a responder só com as checagens gratuitas.'
        : 'No ritmo atual você fecha o mês dentro do teto, com folga de ' + moeda(o.teto_cent - projecao) + '.') +
      '</p></div>';
  }
  return html;
}


/* =============================================================
   5. TELA 2 — FILA
   ============================================================= */

var filtroFila = 'tudo';

function montaFiltrosFila() {
  var grupos = [
    ['tudo', 'Tudo'],
    ['golpe_novo', 'Golpe novo'],
    ['contestacao', 'Contestações'],
    ['denuncia', 'Denúncias'],
    ['empresa', 'Empresas'],
    ['atrasado', 'Atrasados']
  ];
  $('#filtros-fila').innerHTML = grupos.map(function (g) {
    var n = g[0] === 'tudo' ? DADOS.fila.length
      : g[0] === 'atrasado'
        ? DADOS.fila.filter(function (i) { return calculaPrazo(i).urgencia === 'atrasado'; }).length
        : DADOS.fila.filter(function (i) { return i.fila === g[0]; }).length;
    return '<button class="filtro" type="button" data-filtro="' + g[0] + '" ' +
      'aria-pressed="' + (filtroFila === g[0]) + '">' + g[1] +
      ' <span class="n">' + n + '</span></button>';
  }).join('');

  $$('#filtros-fila .filtro').forEach(function (b) {
    b.addEventListener('click', function () {
      filtroFila = b.dataset.filtro;
      montaFiltrosFila();
      montaFila();
    });
  });
}

function montaFila() {
  var termo = ($('#busca').value || '').trim().toLowerCase();

  var lista = DADOS.fila.filter(function (i) {
    var p = calculaPrazo(i);
    if (filtroFila === 'atrasado' && p.urgencia !== 'atrasado') return false;
    if (filtroFila !== 'tudo' && filtroFila !== 'atrasado' && i.fila !== filtroFila) return false;
    if (termo) {
      var alvo = (i.referencia + ' ' + i.alvo + ' ' + i.assunto).toLowerCase();
      if (alvo.indexOf(termo) === -1) return false;
    }
    return true;
  });

  /* Ordem oficial: golpe novo primeiro, depois atrasado, depois
     por quanto falta. É a mesma ORDER BY da view v_fila_admin. */
  var peso = { 'prioridade': 0, 'atrasado': 1, 'urgente': 2, 'no prazo': 3 };
  lista.sort(function (a, b) {
    var pa = calculaPrazo(a), pb = calculaPrazo(b);
    if (peso[pa.urgencia] !== peso[pb.urgencia]) return peso[pa.urgencia] - peso[pb.urgencia];
    return pa.limite - pb.limite;
  });

  if (!lista.length) {
    $('#corpo-fila').innerHTML = '<tr><td colspan="7"><div class="vazio">' +
      '<i class="bi bi-inbox" aria-hidden="true"></i><b>Nada aqui</b>' +
      '<span>Nenhum item bate com esse filtro.</span></div></td></tr>';
    $('#pe-fila').textContent = '';
    return;
  }

  $('#corpo-fila').innerHTML = lista.map(function (i) {
    var p = calculaPrazo(i);
    var r = ROTULO_FILA[i.fila];
    var classePrazo = p.urgencia === 'prioridade' ? 'prazo--prioridade'
      : p.urgencia === 'atrasado' ? 'prazo--atrasado'
      : p.urgencia === 'urgente' ? 'prazo--urgente' : '';

    return '<tr data-abre="fila" data-id="' + esc(i.id) + '" tabindex="0">' +
      '<td><span class="tipo ' + r.classe + '"><i></i>' + r.txt + '</span></td>' +
      '<td class="mono forte">' + esc(i.referencia) + '</td>' +
      '<td class="dois-andares"><b>' + esc(ROTULO_ASSUNTO[i.assunto] || i.assunto) + '</b>' +
        '<span>' + esc(i.descricao_novo || i.relato || i.alegacao || 'Cadastro aguardando conferência') + '</span></td>' +
      '<td class="mono">' + esc(i.alvo) + '</td>' +
      '<td><span class="prazo ' + classePrazo + '"><i style="width:' + p.pct + '%"></i></span>' +
        '<span class="legenda-prazo">' + p.legenda + '</span></td>' +
      '<td class="apertado">' + chipUrgencia(p.urgencia) + '</td>' +
      '<td class="apertado"><i class="bi bi-chevron-right" style="color:var(--texto-3)" aria-hidden="true"></i></td>' +
      '</tr>';
  }).join('');

  var atras = lista.filter(function (i) { return calculaPrazo(i).urgencia === 'atrasado'; }).length;
  $('#pe-fila').innerHTML = lista.length + ' item' + (lista.length === 1 ? '' : 's') +
    ' · ' + (atras ? '<b style="color:var(--risco)">' + atras + ' fora do prazo</b>' : 'nenhum fora do prazo') +
    ' · clique numa linha para decidir.';
}


/* =============================================================
   6. TELA 3 — CONTAS
   ============================================================= */

var filtroContas = 'todas';

function montaFiltrosContas() {
  var g = [['todas', 'Todas'], ['pagantes', 'Assinantes'], ['gratis', 'Grátis'],
           ['atrasada', 'Em atraso'], ['suspensa', 'Suspensas']];
  $('#filtros-contas').innerHTML = g.map(function (x) {
    return '<button class="filtro" type="button" data-filtro="' + x[0] + '" ' +
      'aria-pressed="' + (filtroContas === x[0]) + '">' + x[1] + '</button>';
  }).join('');
  $$('#filtros-contas .filtro').forEach(function (b) {
    b.addEventListener('click', function () {
      filtroContas = b.dataset.filtro; montaFiltrosContas(); montaContas();
    });
  });
}

function montaContas() {
  var termo = ($('#busca').value || '').trim().toLowerCase();

  var ativas = DADOS.contas.filter(function (c) { return c.status === 'ativa'; });
  var pagantes = DADOS.contas.filter(function (c) {
    return c.status_assinatura === 'ativa' || c.status_assinatura === 'atrasada';
  });
  var estourando = DADOS.contas.filter(function (c) {
    return c.limite_mes && c.usou_mes / c.limite_mes >= 0.9;
  });

  $('#stats-contas').innerHTML = [
    { rot: 'Contas', ico: 'bi-people', n: DADOS.contas.length, pe: ativas.length + ' ativas' },
    { rot: 'Assinantes', ico: 'bi-credit-card', n: pagantes.length,
      pe: Math.round(pagantes.length / DADOS.contas.length * 100) + '% da base' },
    { rot: 'Perto do limite', ico: 'bi-speedometer2', n: estourando.length,
      pe: 'candidatas a subir de plano' },
    { rot: 'Suspensas', ico: 'bi-slash-circle',
      n: DADOS.contas.filter(function (c) { return c.status === 'suspensa'; }).length,
      pe: 'por uso automatizado' }
  ].map(function (t) {
    return '<div class="stat"><span class="rot"><i class="bi ' + t.ico + '" aria-hidden="true"></i>' +
      t.rot + '</span><b>' + t.n + '</b><span>' + t.pe + '</span></div>';
  }).join('');

  var lista = DADOS.contas.filter(function (c) {
    if (filtroContas === 'pagantes' && !(c.status_assinatura === 'ativa' || c.status_assinatura === 'atrasada')) return false;
    if (filtroContas === 'gratis' && c.plano !== 'gratis') return false;
    if (filtroContas === 'atrasada' && c.status_assinatura !== 'atrasada') return false;
    if (filtroContas === 'suspensa' && c.status !== 'suspensa') return false;
    if (termo && (c.nome + ' ' + c.email).toLowerCase().indexOf(termo) === -1) return false;
    return true;
  });

  $('#conta-total').textContent = lista.length + ' de ' + DADOS.contas.length;

  if (!lista.length) {
    $('#corpo-contas').innerHTML = '<tr><td colspan="6"><div class="vazio">' +
      '<i class="bi bi-person-x" aria-hidden="true"></i><b>Nenhuma conta</b>' +
      '<span>Nada bate com esse filtro.</span></div></td></tr>';
    return;
  }

  $('#corpo-contas').innerHTML = lista.map(function (c) {
    var pct = c.limite_mes ? Math.min(100, Math.round(c.usou_mes / c.limite_mes * 100)) : 0;
    var classe = !c.limite_mes ? 'sem-limite' : pct >= 100 ? 'estourou' : pct >= 90 ? 'cheio' : '';
    var usoTxt = c.limite_mes ? c.usou_mes + '/' + c.limite_mes : c.usou_mes + ' · sem limite';

    var assin = c.status_assinatura === 'ativa'
        ? '<span class="chip chip--ok">em dia</span>'
      : c.status_assinatura === 'atrasada'
        ? '<span class="chip chip--urgente">em atraso</span>'
      : c.status_assinatura === 'teste'
        ? '<span class="chip chip--azul">em teste</span>'
      : c.status_assinatura === 'cancelada'
        ? '<span class="chip chip--neutro">cancelada</span>'
      : '<span class="chip chip--neutro">sem plano</span>';

    return '<tr data-abre="conta" data-id="' + esc(c.id) + '" tabindex="0">' +
      '<td class="dois-andares"><b>' + esc(c.nome) + '</b>' +
        '<span class="mono">' + esc(cobreEmail(c.email)) + '</span></td>' +
      '<td><span class="chip chip--neutro">' + esc(c.plano) + '</span></td>' +
      '<td><span class="uso ' + classe + '"><span class="trilho"><i style="width:' +
        (c.limite_mes ? pct : 0) + '%"></i></span><span class="txt">' + usoTxt + '</span></span></td>' +
      '<td>' + assin + '</td>' +
      '<td>' + desde(c.ultimo_acesso_em) + '</td>' +
      '<td class="apertado">' + (c.status === 'suspensa'
        ? '<span class="chip chip--atrasado">suspensa</span>'
        : '<span class="chip chip--prazo">ativa</span>') + '</td>' +
      '</tr>';
  }).join('');
}


/* =============================================================
   7. TELA 4 — EMPRESAS
   ============================================================= */

var filtroEmpresas = 'todas';
var SELO = {
  registrada:   ['selo--registrada', 'bi-file-earmark-check', 'Registrada'],
  verificada:   ['selo--verificada', 'bi-patch-check-fill', 'Verificada'],
  estabelecida: ['selo--estabelecida', 'bi-award-fill', 'Estabelecida'],
  curadoria:    ['selo--curadoria', 'bi-star-fill', 'Curadoria']
};

function montaFiltrosEmpresas() {
  var g = [['todas', 'Todas'], ['em_analise', 'Esperando análise'],
           ['aprovada', 'Aprovadas'], ['sem_posse', 'Sem posse comprovada']];
  $('#filtros-empresas').innerHTML = g.map(function (x) {
    return '<button class="filtro" type="button" data-filtro="' + x[0] + '" ' +
      'aria-pressed="' + (filtroEmpresas === x[0]) + '">' + x[1] + '</button>';
  }).join('');
  $$('#filtros-empresas .filtro').forEach(function (b) {
    b.addEventListener('click', function () {
      filtroEmpresas = b.dataset.filtro; montaFiltrosEmpresas(); montaEmpresas();
    });
  });
}

/* Uma empresa só pode passar de "registrada" se pelo menos uma
   propriedade tiver posse confirmada. Mesma regra da função
   bonus_empresa() em 004_empresas.sql. */
function temPosse(e) {
  return e.propriedades.some(function (p) { return !!p.confirmada_em; });
}

function montaEmpresas() {
  var termo = ($('#busca').value || '').trim().toLowerCase();

  $('#stats-empresas').innerHTML = [
    { rot: 'Cadastradas', ico: 'bi-shop', n: DADOS.empresas.length, pe: 'em todos os níveis' },
    { rot: 'Esperando você', ico: 'bi-hourglass-split',
      n: DADOS.empresas.filter(function (e) { return e.status === 'em_analise'; }).length,
      pe: 'prazo de 7 dias cada' },
    { rot: 'Com selo', ico: 'bi-patch-check',
      n: DADOS.empresas.filter(function (e) { return e.nivel && e.nivel !== 'registrada'; }).length,
      pe: 'posse do domínio comprovada' },
    { rot: 'Sem posse', ico: 'bi-shield-slash',
      n: DADOS.empresas.filter(function (e) { return !temPosse(e); }).length,
      pe: 'travadas no nível registrada' }
  ].map(function (t) {
    return '<div class="stat"><span class="rot"><i class="bi ' + t.ico + '" aria-hidden="true"></i>' +
      t.rot + '</span><b>' + t.n + '</b><span>' + t.pe + '</span></div>';
  }).join('');

  var lista = DADOS.empresas.filter(function (e) {
    if (filtroEmpresas === 'em_analise' && e.status !== 'em_analise') return false;
    if (filtroEmpresas === 'aprovada' && e.status !== 'aprovada') return false;
    if (filtroEmpresas === 'sem_posse' && temPosse(e)) return false;
    if (termo && (e.nome_fantasia + ' ' + (e.cnpj || '')).toLowerCase().indexOf(termo) === -1) return false;
    return true;
  });

  if (!lista.length) {
    $('#corpo-empresas').innerHTML = '<tr><td colspan="6"><div class="vazio">' +
      '<i class="bi bi-shop-window" aria-hidden="true"></i><b>Nenhuma empresa</b>' +
      '<span>Nada bate com esse filtro.</span></div></td></tr>';
    return;
  }

  $('#corpo-empresas').innerHTML = lista.map(function (e) {
    var s = e.nivel ? SELO[e.nivel] : null;
    var principal = e.propriedades[0];
    var posse = temPosse(e);

    return '<tr data-abre="empresa" data-id="' + esc(e.ref) + '" tabindex="0">' +
      '<td class="dois-andares"><b>' + esc(e.nome_fantasia) + '</b>' +
        '<span>' + esc(e.razao_social || 'sem razão social informada') + '</span></td>' +
      '<td class="mono">' + esc(e.cnpj || '—') + '</td>' +
      '<td class="dois-andares"><b class="mono" style="font-weight:500">' + esc(principal.valor) + '</b>' +
        '<span>' + (posse
          ? '<span style="color:var(--ok)">✓ posse confirmada</span>'
          : '<span style="color:var(--alerta)">aguardando prova de posse</span>') +
          (e.propriedades.length > 1 ? ' · +' + (e.propriedades.length - 1) : '') + '</span></td>' +
      '<td>' + (s
        ? '<span class="selo ' + s[0] + '"><i class="bi ' + s[1] + '" aria-hidden="true"></i>' + s[2] + '</span>'
        : '<span class="chip chip--neutro">sem nível</span>') + '</td>' +
      '<td>' + (e.denuncias_90d
        ? '<span class="chip ' + (e.denuncias_90d >= 3 ? 'chip--atrasado' : 'chip--urgente') + '">' +
          e.denuncias_90d + '</span>'
        : '<span style="color:var(--texto-3)">0</span>') + '</td>' +
      '<td class="apertado">' + (
        e.status === 'em_analise' ? '<span class="chip chip--urgente">em análise</span>' :
        e.status === 'aprovada'   ? '<span class="chip chip--ok">aprovada</span>' :
        e.status === 'recusada'   ? '<span class="chip chip--atrasado">recusada</span>' :
                                    '<span class="chip chip--neutro">' + esc(e.status) + '</span>') + '</td>' +
      '</tr>';
  }).join('');
}


/* =============================================================
   8. TELA 5 — CUSTOS
   ============================================================= */

function montaCustos() {
  aplicaMedidor($('#medidor-custos'), DADOS.orcamento, true);

  /* --- conta que fecha ---
     Números derivados, não digitados: se o gasto mudar, isto muda. */
  var totalVerif = DADOS.dias.reduce(function (s, d) { return s + d.verificacoes; }, 0);
  var totalImg   = DADOS.dias.reduce(function (s, d) { return s + d.imagens; }, 0);
  var totalCusto = DADOS.dias.reduce(function (s, d) { return s + d.custo_cent; }, 0);
  var porVerif   = totalCusto / totalVerif;
  var custoImg   = 8; /* openai 6 + hive 2, em centavos */
  var custoSemImg = 1;

  $('#pares-margem').innerHTML =
    '<dt>Por verificação</dt><dd><b>' + moeda(Math.round(porVerif * 100) / 100) + '</b> na média dos 7 dias</dd>' +
    '<dt>Só link e domínio</dt><dd>' + moeda(custoSemImg) + ' — quase tudo é checagem gratuita</dd>' +
    '<dt>Com leitura de imagem</dt><dd>' + moeda(custoImg) + ' — é a IA que custa</dd>' +
    '<dt>Volume no período</dt><dd>' + totalVerif.toLocaleString('pt-BR') + ' verificações, ' +
      totalImg + ' com imagem (' + Math.round(totalImg / totalVerif * 100) + '%)</dd>' +
    '<dt>Gasto no período</dt><dd>' + moeda(totalCusto) + '</dd>';

  /* Quantas verificações um assinante do Básico paga */
  var basico = 1290;
  var cobre = Math.floor(basico / porVerif);
  $('#ponto-equilibrio').innerHTML =
    '<b>Um assinante do Básico (R$ 12,90) cobre cerca de ' + cobre.toLocaleString('pt-BR') +
    ' verificações.</b> O plano dá 30 por mês. Enquanto a proporção de imagem ficar perto de ' +
    Math.round(totalImg / totalVerif * 100) + '%, cada assinante paga o próprio custo com folga grande — ' +
    'o risco real não é o custo médio, é uma conta só abusando do limite.';

  $('#corpo-servicos').innerHTML = DADOS.servicos.map(function (s) {
    return '<tr>' +
      '<td class="mono forte">' + esc(s.servico) + '</td>' +
      '<td>' + esc(s.para) + '</td>' +
      '<td class="dir">' + s.chamadas.toLocaleString('pt-BR') + '</td>' +
      '<td class="dir">' + (s.medio_cent ? moeda(s.medio_cent) : 'grátis') + '</td>' +
      '<td class="dir forte">' + (s.total_cent ? moeda(s.total_cent) : '—') + '</td>' +
      '<td class="dir">' + (s.falhas
        ? '<span style="color:var(--alerta)">' + s.falhas + '</span>'
        : '<span style="color:var(--texto-3)">0</span>') + '</td>' +
      '</tr>';
  }).join('');

  $('#corpo-dias').innerHTML = DADOS.dias.map(function (d) {
    return '<tr>' +
      '<td class="mono">' + dataCurta(d.dia) + '</td>' +
      '<td class="dir">' + d.verificacoes + '</td>' +
      '<td class="dir">' + d.imagens + '</td>' +
      '<td class="dir forte">' + moeda(d.custo_cent) + '</td>' +
      '<td class="dir">' + moeda(Math.round(d.custo_cent / d.verificacoes * 100) / 100) + '</td>' +
      '</tr>';
  }).join('');
}


/* =============================================================
   9. GAVETA DE DECISÃO

   Nenhuma decisão acontece sem três coisas na tela ao mesmo tempo:
     1. o caso;
     2. a regra escrita que se aplica a ele;
     3. o que vai ficar registrado.
   ============================================================= */

var gaveta = $('#gaveta'), fundo = $('#fundo-gaveta'), focoAnterior = null;

function regraHTML(chave) {
  var r = DADOS.politica[chave];
  if (!r) return '';
  return '<div class="regra">' +
    '<span class="marcador"><i class="bi bi-journal-check" aria-hidden="true"></i>Regra que se aplica</span>' +
    '<p class="situacao">' + esc(r.situacao) + '</p>' +
    '<dl>' +
      '<div><dt>O que exigimos</dt><dd>' + esc(r.exige) + '</dd></div>' +
      '<div><dt>O que fazemos</dt><dd>' + esc(r.decisao) + '</dd></div>' +
    '</dl>' +
    '<p class="rodape-regra">Está escrita em <b>politica_moderacao</b>, com prazo de ' +
    r.prazo_dias + ' dias. Decidir diferente disso é permitido — mas exige justificativa por ' +
    'escrito no protocolo, porque é ela que responde “por que vocês fizeram isso?” depois.</p>' +
    '</div>';
}

function auditoriaHTML(acao, ref) {
  return '<div class="auditoria-previa">' +
    '<span class="rot">Vai ficar registrado</span>' +
    '<code class="mono">auditoria ← ' + esc(acao) + '</code> · alvo <code class="mono">' + esc(ref) +
    '</code> · por <b>Kaina Rodrigues</b> · agora · com o valor antes e depois.' +
    '</div>';
}

function provasHTML(provas) {
  var ICO = {
    print_conversa: 'bi-chat-square-text', comprovante: 'bi-receipt',
    anuncio: 'bi-megaphone', pagina: 'bi-window', boletim_ocorrencia: 'bi-shield-fill-check',
    contrato_social: 'bi-file-earmark-text', prova_dns: 'bi-hdd-network',
    documento: 'bi-person-vcard', outro: 'bi-paperclip'
  };
  var NOME = {
    print_conversa: 'Print de conversa', comprovante: 'Comprovante',
    anuncio: 'Anúncio', pagina: 'Página capturada', boletim_ocorrencia: 'Boletim de ocorrência',
    contrato_social: 'Contrato social', prova_dns: 'Registro DNS',
    documento: 'Documento de identidade', outro: 'Anexo'
  };
  return '<div class="provas">' + provas.map(function (p) {
    return '<div class="prova' + (p.tipo === 'boletim_ocorrencia' ? ' bo' : '') + '">' +
      '<i class="bi ' + (ICO[p.tipo] || 'bi-paperclip') + '" aria-hidden="true"></i>' +
      '<span class="nome"><b>' + esc(p.nome) + '</b>' +
      '<span>' + esc(NOME[p.tipo] || p.tipo) + ' · ' + esc(p.bytes) + '</span></span>' +
      '<button class="bt bt--fantasma bt--pequeno" type="button">abrir</button>' +
      '</div>';
  }).join('') + '</div>';
}

/* --- gaveta: item da fila --- */
function abreItemFila(id) {
  var i = DADOS.fila.filter(function (x) { return x.id === id; })[0];
  if (!i) return;
  var p = calculaPrazo(i);
  var corpo = '', pe = '';

  $('#gaveta-titulo').textContent = ROTULO_ASSUNTO[i.assunto] || i.assunto;
  $('#gaveta-refs').innerHTML =
    '<span class="mono">' + esc(i.referencia) + '</span>' +
    chipUrgencia(p.urgencia) +
    '<span>esperando ' + p.esperando.replace('há ', '') + ' · ' + p.legenda + '</span>';

  /* ---------- CONTESTAÇÃO ---------- */
  if (i.fila === 'contestacao') {
    var travado = !i.identidade_confirmada;

    corpo =
      '<div class="bloco-gaveta">' +
        (travado
          ? '<div class="trava"><i class="bi bi-lock-fill" aria-hidden="true"></i>' +
            '<p><b>Identidade não confirmada.</b> Não dá para deferir. Quem pede remoção precisa ' +
            'provar que é quem diz ser — senão qualquer golpista limpa a própria ficha por e-mail. ' +
            'As ações de deferimento ficam bloqueadas até a comprovação chegar.</p></div>'
          : '<div class="trava trava--ok"><i class="bi bi-patch-check-fill" aria-hidden="true"></i>' +
            '<p><b>Identidade confirmada</b> por <code class="mono">' + esc(i.metodo_identidade) +
            '</code>. Pode decidir.</p></div>') +
      '</div>' +

      '<div class="bloco-gaveta"><h3>Quem pediu</h3>' +
        '<dl class="pares">' +
          '<dt>Nome</dt><dd>' + esc(i.solicitante_nome) + '</dd>' +
          '<dt>E-mail</dt><dd class="mono">' + esc(i.solicitante_email) + '</dd>' +
          '<dt>Relação</dt><dd>' + esc(i.relacao) + '</dd>' +
          '<dt>Alvo</dt><dd class="mono">' + esc(i.alvo) + '</dd>' +
          (i.score_antes !== null && i.score_antes !== undefined
            ? '<dt>Score hoje</dt><dd>' + i.score_antes + '/100</dd>' : '') +
          '<dt>Denúncias no alvo</dt><dd>' + i.denuncias_no_alvo +
            (i.denuncias_no_alvo ? ' <span class="chip chip--urgente">pesa na decisão</span>' : '') + '</dd>' +
          (i.cnpj_situacao ? '<dt>CNPJ na Receita</dt><dd>' + esc(i.cnpj_situacao) + '</dd>' : '') +
        '</dl>' +
      '</div>' +

      '<div class="bloco-gaveta"><h3>O que alegam</h3>' +
        '<div class="citacao">' + esc(i.alegacao) + '</div>' +
      '</div>' +

      (i.sinais_contra
        ? '<div class="bloco-gaveta"><h3>Sinais contra o pedido</h3>' +
          '<div class="trava"><i class="bi bi-exclamation-octagon-fill" aria-hidden="true"></i>' +
          '<p>' + i.sinais_contra.map(esc).join('<br>') + '</p></div></div>'
        : '') +

      (i.anexos && i.anexos.length
        ? '<div class="bloco-gaveta"><h3>Anexos</h3>' + provasHTML(i.anexos) + '</div>'
        : '<div class="bloco-gaveta"><h3>Anexos</h3>' +
          '<p style="color:var(--texto-3)">Nenhum documento apresentado.</p></div>') +

      '<div class="bloco-gaveta">' + regraHTML(i.regra) + '</div>';

    pe =
      auditoriaHTML('contestacao.decidir', i.referencia) +
      '<div class="espaco"></div>' +
      '<div class="linha-bt">' +
        '<button class="bt bt--ok" type="button"' + (travado ? ' aria-disabled="true"' : '') + '>' +
          '<i class="bi bi-check-lg" aria-hidden="true"></i> Deferir</button>' +
        '<button class="bt bt--calmo" type="button"' + (travado ? ' aria-disabled="true"' : '') + '>' +
          'Deferir em parte</button>' +
        '<button class="bt bt--risco" type="button">' +
          '<i class="bi bi-x-lg" aria-hidden="true"></i> Indeferir</button>' +
        '<button class="bt bt--fantasma" type="button">' +
          '<i class="bi bi-envelope" aria-hidden="true"></i> Pedir comprovação</button>' +
      '</div>';
  }

  /* ---------- DENÚNCIA / GOLPE NOVO ---------- */
  if (i.fila === 'denuncia' || i.fila === 'golpe_novo') {
    var temBO = (i.provas || []).some(function (x) { return x.tipo === 'boletim_ocorrencia'; });

    corpo =
      (i.fila === 'golpe_novo'
        ? '<div class="bloco-gaveta"><div class="trava">' +
          '<i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>' +
          '<p><b>Marcada como golpe novo pela própria vítima.</b> Prazo de 2 dias em vez de 7. ' +
          'Confirmando, abra a linha em <code class="mono">golpes_conhecidos</code> com o roteiro: ' +
          'é isso que faz o sistema reconhecer esse golpe quando ele voltar com outro nome.</p>' +
          '</div></div>'
        : '') +

      '<div class="bloco-gaveta"><h3>O caso</h3>' +
        '<dl class="pares">' +
          '<dt>Alvo</dt><dd class="mono">' + esc(i.alvo) + '</dd>' +
          '<dt>Categoria</dt><dd>' + esc(ROTULO_ASSUNTO[i.categoria] || i.categoria) + '</dd>' +
          '<dt>Prejuízo</dt><dd>' + (i.prejuizo_cent ? '<b>' + moeda(i.prejuizo_cent) + '</b>' : 'não houve') + '</dd>' +
          '<dt>Quem denunciou</dt><dd>' + (i.anonima ? 'anônima' : esc(i.denunciante)) + '</dd>' +
          '<dt>Casos parecidos</dt><dd>' + i.semelhantes +
            (i.semelhantes >= 5 ? ' <span class="chip chip--atrasado">padrão repetido</span>'
             : i.semelhantes === 0 ? ' <span class="chip chip--prioridade">primeiro registro</span>' : '') + '</dd>' +
        '</dl>' +
      '</div>' +

      '<div class="bloco-gaveta"><h3>Relato</h3>' +
        '<div class="citacao">' + esc(i.relato) +
        '<em>Texto escrito por quem denunciou. Publicamos o relato, não o transformamos em acusação nossa.</em>' +
        '</div>' +
      '</div>' +

      (i.descricao_novo
        ? '<div class="bloco-gaveta"><h3>O que teve de diferente</h3>' +
          '<div class="citacao">' + esc(i.descricao_novo) + '</div></div>'
        : '') +

      '<div class="bloco-gaveta"><h3>Provas</h3>' + provasHTML(i.provas || []) +
        (temBO
          ? '<div style="margin-top:10px" class="trava trava--ok">' +
            '<i class="bi bi-shield-fill-check" aria-hidden="true"></i>' +
            '<p><b>Tem boletim de ocorrência.</b> Pesa muito na análise e é o que sustenta a ' +
            'decisão se a empresa contestar depois. Fica guardado por 2 anos, mesmo que a ' +
            'denúncia saia do ar.</p></div>'
          : '') +
      '</div>' +

      '<div class="bloco-gaveta">' + regraHTML(i.regra) + '</div>';

    pe =
      auditoriaHTML('denuncia.decidir', i.referencia) +
      '<div class="espaco"></div>' +
      '<div class="linha-bt">' +
        '<button class="bt bt--risco" type="button">' +
          '<i class="bi bi-check-lg" aria-hidden="true"></i> Confirmar denúncia</button>' +
        (i.fila === 'golpe_novo'
          ? '<button class="bt bt--principal" type="button">' +
            '<i class="bi bi-plus-lg" aria-hidden="true"></i> Abrir golpe novo</button>'
          : '') +
        '<button class="bt bt--fantasma" type="button">Pedir mais informação</button>' +
        '<button class="bt bt--calmo" type="button">Recusar</button>' +
      '</div>';
  }

  /* ---------- EMPRESA (vindo da fila) ---------- */
  /* Cadastro de empresa não tem gaveta própria: a ficha da empresa
     já mostra tudo que é preciso para decidir, inclusive a trava de
     posse. Abre direto — sem fechar antes, senão o setTimeout do
     fechamento esconde a gaveta que acabou de abrir. */
  if (i.fila === 'empresa') { abreEmpresa(i.empresa_ref); return; }

  $('#gaveta-corpo').innerHTML = corpo;
  $('#gaveta-pe').innerHTML = pe;
  mostraGaveta();
}

/* --- gaveta: conta --- */
function abreConta(id) {
  var c = DADOS.contas.filter(function (x) { return x.id === id; })[0];
  if (!c) return;
  var pct = c.limite_mes ? Math.round(c.usou_mes / c.limite_mes * 100) : null;

  $('#gaveta-titulo').textContent = c.nome;
  $('#gaveta-refs').innerHTML =
    '<span class="chip chip--neutro">' + esc(c.plano) + '</span>' +
    (c.status === 'suspensa'
      ? '<span class="chip chip--atrasado">suspensa</span>'
      : '<span class="chip chip--prazo">ativa</span>') +
    '<span>conta desde ' + esc(dataBR(c.criada_em)) + '</span>';

  $('#gaveta-corpo').innerHTML =
    (c.motivo_suspensao
      ? '<div class="bloco-gaveta"><div class="trava">' +
        '<i class="bi bi-slash-circle-fill" aria-hidden="true"></i>' +
        '<p><b>Conta suspensa.</b> ' + esc(c.motivo_suspensao) + '</p></div></div>'
      : '') +

    '<div class="bloco-gaveta"><h3>Contato</h3>' +
      '<dl class="pares">' +
        '<dt>E-mail</dt><dd>' + ocultoHTML(c.email, 'email', c.nome) + '</dd>' +
        '<dt>Telefone</dt><dd>' + ocultoHTML(c.telefone, 'telefone', c.nome) + '</dd>' +
        '<dt>Último acesso</dt><dd>' + desde(c.ultimo_acesso_em) + '</dd>' +
        '<dt>Pessoas na conta</dt><dd>' + c.membros + '</dd>' +
      '</dl>' +
      '<div class="auditoria-previa" style="margin-top:14px">' +
        '<span class="rot">Por que está coberto</span>' +
        'Você não precisa do e-mail de todo mundo para operar o painel — precisa do e-mail de quem ' +
        'você está atendendo agora. Revelar grava <code class="mono">dado.revelar</code> na auditoria ' +
        'com o seu nome. Se um dia esta conta de admin vazar, o estrago é menor.' +
      '</div>' +
    '</div>' +

    '<div class="bloco-gaveta"><h3>Assinatura</h3>' +
      '<dl class="pares">' +
        '<dt>Plano</dt><dd>' + esc(c.plano) + '</dd>' +
        '<dt>Situação</dt><dd>' + esc(c.status_assinatura || 'sem assinatura') + '</dd>' +
        '<dt>Próxima cobrança</dt><dd>' + (c.proxima_cobranca ? dataBR(c.proxima_cobranca) : '—') + '</dd>' +
      '</dl>' +
      (c.status_assinatura === 'atrasada'
        ? '<div style="margin-top:12px" class="trava trava--aviso">' +
          '<i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>' +
          '<p><b>Pagamento em atraso desde 19/08.</b> O Asaas já tentou 2 vezes. Antes de cortar ' +
          'o acesso, o combinado nos Termos é avisar por e-mail e dar 5 dias.</p></div>'
        : '') +
    '</div>' +

    '<div class="bloco-gaveta"><h3>Uso</h3>' +
      '<dl class="pares">' +
        '<dt>Este mês</dt><dd>' + c.usou_mes + (c.limite_mes ? ' de ' + c.limite_mes : ' (sem limite)') +
          (pct !== null ? ' · ' + pct + '%' : '') + '</dd>' +
        '<dt>Com imagem</dt><dd>' + c.imagens_mes + '</dd>' +
        '<dt>Desde o começo</dt><dd>' + c.total.toLocaleString('pt-BR') + '</dd>' +
      '</dl>' +
      (pct !== null && pct >= 90
        ? '<div style="margin-top:12px" class="trava trava--aviso">' +
          '<i class="bi bi-speedometer2" aria-hidden="true"></i>' +
          '<p><b>Chegando no limite do plano.</b> É o momento certo de oferecer o plano de cima — ' +
          'e o momento errado de deixar a pessoa bater na trava sem aviso.</p></div>'
        : '') +
    '</div>';

  $('#gaveta-pe').innerHTML =
    auditoriaHTML('conta.alterar', c.id) +
    '<div class="espaco"></div>' +
    '<div class="linha-bt">' +
      '<button class="bt bt--calmo" type="button"><i class="bi bi-envelope" aria-hidden="true"></i> Enviar e-mail</button>' +
      '<button class="bt bt--calmo" type="button"><i class="bi bi-download" aria-hidden="true"></i> Exportar dados (LGPD)</button>' +
      (c.status === 'suspensa'
        ? '<button class="bt bt--ok" type="button"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reativar</button>'
        : '<button class="bt bt--risco" type="button"><i class="bi bi-slash-circle" aria-hidden="true"></i> Suspender</button>') +
    '</div>';

  mostraGaveta();
  ligaOcultos();
}

function ocultoHTML(valor, tipo, quem) {
  var coberto = tipo === 'email' ? cobreEmail(valor) : cobreTelefone(valor);
  return '<span class="oculto" data-real="' + esc(valor) + '" data-quem="' + esc(quem) + '">' +
    '<span class="valor">' + esc(coberto) + '</span>' +
    '<button type="button" title="Revelar (fica registrado)" aria-label="Revelar">' +
    '<i class="bi bi-eye" aria-hidden="true"></i></button></span>';
}

function ligaOcultos() {
  $$('.oculto button', gaveta).forEach(function (b) {
    b.addEventListener('click', function () {
      var caixa = b.parentNode;
      $('.valor', caixa).textContent = caixa.dataset.real;
      b.outerHTML = '<span class="chip chip--azul" style="margin-left:4px">' +
        '<i class="bi bi-journal-text" aria-hidden="true"></i>registrado</span>';
    });
  });
}

/* --- gaveta: empresa --- */
function abreEmpresa(ref) {
  var e = DADOS.empresas.filter(function (x) { return x.ref === ref; })[0];
  if (!e) return;
  var posse = temPosse(e);
  var s = e.nivel ? SELO[e.nivel] : null;

  $('#gaveta-titulo').textContent = e.nome_fantasia;
  $('#gaveta-refs').innerHTML =
    (e.cnpj ? '<span class="mono">' + esc(e.cnpj) + '</span>' : '<span>sem CNPJ</span>') +
    (s ? '<span class="selo ' + s[0] + '"><i class="bi ' + s[1] + '" aria-hidden="true"></i>' + s[2] + '</span>'
       : '<span class="chip chip--neutro">sem nível</span>');

  var propriedades = e.propriedades.map(function (p) {
    var ok = !!p.confirmada_em;
    return '<div class="prova' + (ok ? ' bo' : '') + '">' +
      '<i class="bi ' + (p.tipo === 'site' ? 'bi-globe2'
        : p.tipo === 'instagram' ? 'bi-instagram'
        : p.tipo === 'whatsapp' ? 'bi-whatsapp' : 'bi-link-45deg') + '" aria-hidden="true"></i>' +
      '<span class="nome"><b class="mono">' + esc(p.valor) + '</b><span>' +
      (ok ? 'posse confirmada por ' + esc(p.metodo) + ' em ' + esc(dataBR(p.confirmada_em))
          : 'aguardando prova de posse') +
      (p.principal ? ' · principal' : '') + '</span></span>' +
      (ok ? '<span class="chip chip--ok">✓</span>' : '<span class="chip chip--urgente">pendente</span>') +
      '</div>';
  }).join('');

  var semProva = e.propriedades.filter(function (p) { return !p.confirmada_em && p.codigo; })[0];

  $('#gaveta-corpo').innerHTML =
    '<div class="bloco-gaveta">' +
      (posse
        ? '<div class="trava trava--ok"><i class="bi bi-patch-check-fill" aria-hidden="true"></i>' +
          '<p><b>Posse comprovada.</b> Pode receber selo acima de “registrada”.</p></div>'
        : '<div class="trava"><i class="bi bi-lock-fill" aria-hidden="true"></i>' +
          '<p><b>Sem posse comprovada — travada em “registrada”.</b> CNPJ ativo prova que a empresa ' +
          'existe, não que ela é dona deste site. Golpista abre CNPJ; o que ele não consegue é ' +
          'publicar um registro no DNS do domínio da vítima. Por isso a trava.</p></div>') +
    '</div>' +

    (e.atencao
      ? '<div class="bloco-gaveta"><h3>Atenção</h3><div class="trava trava--aviso">' +
        '<i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>' +
        '<p>' + esc(e.atencao) + '</p></div></div>'
      : '') +

    '<div class="bloco-gaveta"><h3>Na Receita</h3>' +
      '<dl class="pares">' +
        '<dt>Razão social</dt><dd>' + esc(e.razao_social || '—') + '</dd>' +
        '<dt>CNPJ</dt><dd class="mono">' + esc(e.cnpj || '—') + '</dd>' +
        '<dt>Situação</dt><dd>' + (e.situacao_receita
          ? '<span class="chip chip--ok">' + esc(e.situacao_receita) + '</span>'
          : '<span class="chip chip--atrasado">não informado</span>') + '</dd>' +
        '<dt>Aberta em</dt><dd>' + (e.abertura
          ? dataBR(e.abertura) + ' · ' + idadeEmpresa(e.abertura) : '—') + '</dd>' +
        '<dt>Denúncias 90d</dt><dd>' + e.denuncias_90d +
          (e.denuncias_90d >= 3 ? ' <span class="chip chip--atrasado">suspende sozinho</span>' : '') + '</dd>' +
      '</dl>' +
    '</div>' +

    '<div class="bloco-gaveta"><h3>Propriedades</h3>' +
      '<div class="provas">' + propriedades + '</div>' +
      (semProva
        ? '<div class="auditoria-previa" style="margin-top:12px">' +
          '<span class="rot">Código de posse gerado</span>' +
          'Peça para publicarem este registro TXT no DNS de <b>' + esc(semProva.valor) + '</b>:<br>' +
          '<code class="mono">' + esc(semProva.codigo) + '</code><br>' +
          'A conferência é automática e roda de hora em hora.' +
          '</div>'
        : '') +
    '</div>' +

    '<div class="bloco-gaveta">' + regraHTML('empresa_cadastro') + '</div>';

  $('#gaveta-pe').innerHTML =
    auditoriaHTML('empresa.decidir', e.nome_fantasia) +
    '<div class="espaco"></div>' +
    '<div class="linha-bt">' +
      '<button class="bt bt--calmo" type="button">' +
        '<i class="bi bi-file-earmark-check" aria-hidden="true"></i> Aprovar como registrada</button>' +
      '<button class="bt bt--ok" type="button"' + (posse ? '' : ' aria-disabled="true"') + '>' +
        '<i class="bi bi-patch-check-fill" aria-hidden="true"></i> Dar selo verificada</button>' +
      '<button class="bt bt--fantasma" type="button">Pedir prova de posse</button>' +
      '<button class="bt bt--risco" type="button">Recusar</button>' +
    '</div>';

  mostraGaveta();
}

function idadeEmpresa(iso) {
  var meses = Math.round((AGORA - new Date(iso)) / (30.4 * DIA));
  if (meses < 12) return meses + ' meses de CNPJ';
  var anos = Math.floor(meses / 12);
  return anos + (anos === 1 ? ' ano' : ' anos') + ' de CNPJ';
}

function mostraGaveta() {
  focoAnterior = document.activeElement;
  gaveta.hidden = false; fundo.hidden = false;
  requestAnimationFrame(function () {
    gaveta.classList.add('aberta'); fundo.classList.add('aberta');
    document.body.classList.add('travado-scroll');
    $('#fecha-gaveta').focus();
  });
}

function fechaGaveta(silencioso) {
  gaveta.classList.remove('aberta'); fundo.classList.remove('aberta');
  document.body.classList.remove('travado-scroll');
  setTimeout(function () { gaveta.hidden = true; fundo.hidden = true; }, 260);
  if (!silencioso && focoAnterior && focoAnterior.focus) focoAnterior.focus();
}

$('#fecha-gaveta').addEventListener('click', function () { fechaGaveta(); });
fundo.addEventListener('click', function () { fechaGaveta(); });
document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape' && !gaveta.hidden) fechaGaveta();
});

/* Abrir por clique ou teclado, em qualquer tabela que tenha data-abre */
document.addEventListener('click', function (ev) {
  var tr = ev.target.closest ? ev.target.closest('tr[data-abre]') : null;
  if (!tr) return;
  if (ev.target.tagName === 'BUTTON') return;
  despacha(tr.dataset.abre, tr.dataset.id);
});
document.addEventListener('keydown', function (ev) {
  if (ev.key !== 'Enter' && ev.key !== ' ') return;
  var tr = ev.target.closest ? ev.target.closest('tr[data-abre]') : null;
  if (!tr) return;
  ev.preventDefault();
  despacha(tr.dataset.abre, tr.dataset.id);
});

function despacha(tipo, id) {
  if (tipo === 'fila') abreItemFila(id);
  if (tipo === 'conta') abreConta(id);
  if (tipo === 'empresa') abreEmpresa(id);
}

/* Ações da gaveta ainda não gravam nada — é protótipo. Melhor
   dizer isso na cara do que fingir que salvou. */
gaveta.addEventListener('click', function (ev) {
  var b = ev.target.closest ? ev.target.closest('.gaveta-pe .bt') : null;
  if (!b || b.getAttribute('aria-disabled') === 'true') return;
  var pe = $('#gaveta-pe');
  if (!$('.aviso-prototipo', pe)) {
    var d = document.createElement('div');
    d.className = 'trava trava--aviso aviso-prototipo';
    d.style.marginTop = '12px';
    d.innerHTML = '<i class="bi bi-cone-striped" aria-hidden="true"></i>' +
      '<p><b>Protótipo.</b> “' + esc(b.textContent.trim()) + '” ainda não grava no banco. ' +
      'Falta ligar a API do painel e a gravação em <code class="mono">auditoria</code>.</p>';
    pe.appendChild(d);
  }
});


/* =============================================================
   10. NAVEGAÇÃO ENTRE TELAS
   ============================================================= */

var TITULOS = {
  painel:   ['Painel', 'sábado, 22 de agosto de 2026'],
  fila:     ['Fila de moderação', 'tudo que espera decisão sua'],
  contas:   ['Contas', 'pessoas e assinaturas'],
  empresas: ['Empresas', 'cadastro, selo e prova de posse'],
  custos:   ['Custos', 'quanto o beta está consumindo']
};

function vai(tela) {
  if (!TITULOS[tela]) tela = 'painel';

  $$('.tela').forEach(function (s) { s.classList.remove('ativa'); });
  var alvo = $('#tela-' + tela);
  if (alvo) alvo.classList.add('ativa');

  $$('.rail a[data-tela]').forEach(function (a) {
    a.classList.toggle('ativo', a.dataset.tela === tela);
  });

  $('#titulo-tela').textContent = TITULOS[tela][0];
  $('#sub-tela').textContent = TITULOS[tela][1];
  $('#busca').value = '';
  $('#rail').classList.remove('aberta');
  window.scrollTo(0, 0);

  if (tela === 'fila')     { montaFiltrosFila(); montaFila(); }
  if (tela === 'contas')   { montaFiltrosContas(); montaContas(); }
  if (tela === 'empresas') { montaFiltrosEmpresas(); montaEmpresas(); }
  if (tela === 'custos')   montaCustos();
}

function daHash() {
  var h = (location.hash || '').replace('#/', '');
  return h || 'painel';
}
addEventListener('hashchange', function () { vai(daHash()); });

/* busca refaz a tabela da tela aberta */
$('#busca').addEventListener('input', function () {
  var tela = daHash();
  if (tela === 'fila') montaFila();
  if (tela === 'contas') montaContas();
  if (tela === 'empresas') montaEmpresas();
});

$('#abre-rail').addEventListener('click', function () {
  $('#rail').classList.toggle('aberta');
});

/* botão de travar o orçamento na mão */
$('#bt-travar').addEventListener('click', function () {
  DADOS.orcamento.travado = !DADOS.orcamento.travado;
  this.innerHTML = DADOS.orcamento.travado
    ? '<i class="bi bi-play-circle" aria-hidden="true"></i> Destravar'
    : '<i class="bi bi-pause-circle" aria-hidden="true"></i> Travar agora';
  montaCustos();
});

/* ---- início ----
   Não monta nada enquanto a tranca estiver de pé. O evento vem de
   assets/tranca.js. Se um dia a tranca sair, troque por chamada
   direta — mas aí o painel já deve estar atrás de sessão de
   servidor, não de tela. */
function comeca() {
  montaPainel();
  vai(daHash());
}

if (document.body.classList.contains('trancado')) {
  document.addEventListener('confia:destrancado', comeca, { once: true });
} else {
  comeca();
}

})();

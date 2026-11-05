# Facebook, Meta e WhatsApp do Confia

Já existe no código um link de Facebook com ID 100081737570267 e Instagram @confia.iia. Verificar propriedade e categoria antes de criar página duplicada. A autorização do titular não substitui login, termos, validação de empresa ou validação de número exigidos pela Meta.

## Código entregue

- Templates de utilidade: `src/lib/confia/templates.ts`.
- Envio individual à conta configurada: `POST /api/confia/meta/templates`, restrito ao titular com TOTP e confirmação. Não envia mensagens a clientes.
- Webhook: `/api/confia/meta/webhook`, valida desafio GET e assinatura HMAC-SHA256 do corpo POST. Aceita eventos da WABA configurada e atualizações de template. Atualização e deduplicação ficam na mesma transação D1.
- Estado ambíguo de submissão fica `conferir_na_meta`, sem repetir chamada automaticamente.

## Segredos de runtime

`META_GRAPH_VERSION` (versão suportada escolhida no aplicativo), `META_ACCESS_TOKEN`, `META_WABA_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`. Futuro envio de mensagens também precisará de `META_PHONE_NUMBER_ID`, consentimento por destinatário e templates aprovados. Não coloque valores no Git.

## Validação ainda necessária

1. Conferir propriedade da página e empresa no Business Suite.
2. Criar/conferir aplicativo e produto WhatsApp, WABA e número de teste.
3. Configurar permissões e token com menor privilégio no runtime.
4. Cadastrar o callback público e confirmar desafio.
5. Ativar segundo fator do administrador no painel.
6. Submeter um template e acompanhar aprovação no WhatsApp Manager.
7. Testar webhook assinado; recusar corpo adulterado e WABA diferente.
8. Só depois implementar envio a número de teste consentido, estados de entrega e opt-out. Não há envio automático nesta entrega.

Fontes oficiais consultadas: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/ e coleção Meta WhatsApp Business Platform no Postman https://www.postman.com/meta/whatsapp-business-platform/ . A aprovação e a classificação final de um template são decisões da Meta.

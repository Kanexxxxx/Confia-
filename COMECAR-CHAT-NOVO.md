# Prompt para começar um chat novo

Copie o bloco abaixo inteiro e cole como **primeira mensagem** de uma conversa
nova, dentro da pasta do projeto.

Ele é curto de propósito. O que faz ele funcionar não é o tamanho — é que a
primeira coisa que ele manda fazer é ler os arquivos onde tudo já está escrito.
Prompt gigante que repete o que está no repositório envelhece; ponteiro para
arquivo, não.

---

```
Estou retomando o confia? (confiia.com.br), meu projeto de verificação
anti-golpe que vou apresentar no Plano Empreenda SENAC. Você não participou
das conversas anteriores, então comece lendo, NESTA ORDEM, antes de escrever
qualquer código ou me responder qualquer coisa:

1. CLAUDE.md          — as regras que não se discutem e as armadilhas técnicas
                        que já custaram horas. Leia inteiro.
2. MELHORIAS.md § I   — a LISTA VIVA. É por aqui que se retoma: o que já ficou
                        pronto e o que ainda falta da minha última rodada de
                        críticas.
3. PLANO.md           — as etapas 1 a 10 e onde a gente está.
4. PENDENCIAS.md      — o que depende de mim (MEI, advogado, chave do cofre).
5. SEGURANCA.md       — as 20 travas de segurança e como conferir cada uma.
6. web/AGENTS.md      — regras do Next.js 16 neste repositório.

Depois de ler, me diga em poucas linhas: onde a gente parou, quais itens ainda
faltam, e qual você faria primeiro. Não comece a mexer em código antes disso.

Cinco coisas que eu não quero ter que repetir:

- confiia.com.br sem "beta." hospeda a versão de um amigo meu. NÃO APAGA NADA
  DELE, nem no servidor nem no registro A do domínio. O nosso é
  beta.confiia.com.br.
- Subir o site no ar é a ÚLTIMA coisa. Tem muita coisa para testar antes.
  Não faça deploy por conta própria.
- Segurança nível Pentágono. Se mexer em banco, permissão, autenticação ou
  formulário público, rode `npm run confere-banco` e `npm run prova-armadilha`
  na pasta web/ antes de dizer que terminou.
- Acessibilidade no celular em toda tela, sempre. Não é etapa final.
- Não pode ter cara de inteligência artificial. Genérico, tudo centralizado,
  caixinha igual atrás de caixinha igual, texto de marketing vazio: já
  recusei tudo isso. Use skills antes de sair codando.

E o código deste projeto é comentado pesado, em português, explicando o PORQUÊ
e principalmente o "se você mexer aqui, tem que mexer ali também". Mantenha
esse tom.

Para rodar: `cd web && npm run tunel` (túnel do Postgres, porta 5433) e
`npm run dev`. Conta de teste: voce@confiia.com.br / testando-o-confia-2026.
```

---

## Por que o prompt é assim

**Ele manda ler antes de agir.** O erro mais caro de um chat novo é começar a
mexer com metade do contexto e refazer o que já estava feito.

**Ele repete as cinco regras mesmo estando no `CLAUDE.md`.** Redundância de
propósito: são as que, se forem quebradas, o estrago é grande ou irreversível —
apagar o site do seu amigo, subir antes da hora, mexer no banco sem conferir.

**Ele pede um resumo antes de qualquer código.** É o seu ponto de conferência:
se o resumo vier errado, você percebe na primeira resposta e não na terceira
hora.

⚠ Se você mudar as regras, mude aqui **e** no `CLAUDE.md`. Dois arquivos
dizendo coisas diferentes é pior do que um só.

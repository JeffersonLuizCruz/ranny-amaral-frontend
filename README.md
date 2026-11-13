# Photoizer CRM

CRM para estúdios fotográficos com dashboard, agenda, clientes, pacotes, contratos, financeiro, galerias de ensaio e **autenticação com perfis de acesso**.

## Como rodar

O frontend consome a API real para **clientes**, **pacotes**, **agenda**, **contratos**, **galerias**, **financeiro**, **modelos**, **estúdio** e **aceite público**. Suba o backend primeiro:

```bash
# em ../ranny-amaral-backend
docker compose -f docker-compose.dev.yml up -d
./mvnw spring-boot:run
```

Depois, no frontend:

```bash
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:8080` (veja `vite.config.ts`). Para apontar para outro host, defina `VITE_API_URL` (ex.: `http://localhost:8080/api/v1`).

### Acesso local

O backend em perfil `dev` cria o admin `admin@rannyamaral.com.br` / `admin12345` (troca obrigatória no primeiro acesso). Depois o admin cria a Ranny em **Usuários** com o perfil `Gestor`.

Validação:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

O CI (`.github/workflows/ci.yml`) executa `npm ci`, `npm run lint`, `npm test`, `npm run build` e publica a imagem `amd64` no GHCR.

A suíte de testes usa **Vitest + Testing Library** e cobre validação de arquivos, cliente de upload, paginação, mapeadores, resumo financeiro, ZIP e KPIs do dashboard.

## Integração com o backend

- `src/shared/api/httpClient.ts` — cliente HTTP único, baseURL `/api/v1`, `credentials: include`, tratamento do `ErrorResponse` e refresh automático em `401`.
- `src/shared/api/session.ts` — access token em memória e renovação via cookie `HttpOnly`.
- `src/features/auth/store/authStore.ts` — login, logout, bootstrap e troca de senha.
- `src/features/auth/components/*` — login, troca obrigatória e guards (`RequireAuth`, `RequireAdmin`).
- `src/features/users/components/UsersPage.tsx` — criação, reset de senha e ativação (apenas `ADMIN`).
- `src/shared/api/types.ts` e `src/shared/components/ui/Paginador.tsx` — envelope `Pagina<T>` e controle reutilizável de paginação.
- `src/shared/upload/*` — hash SHA-256, upload direto ao storage com progresso, cancelamento e retry.
- `src/features/contracts/api/comprovanteApi.ts` — fluxo de upload do comprovante público.
- `src/features/clients/api/clientesApi.ts` — CRUD e listagem paginada de clientes.
- `src/features/packages/api/pacotesApi.ts` — CRUD, alternância de situação e listagem paginada dos pacotes.
- `src/features/appointments/api/agendaApi.ts` — CRUD, status, pagamentos, listagem paginada e calendário por período.
- `src/features/contracts/api/contratosApi.ts` — contratos, busca paginada, links de aceite e pagamentos.
- `src/features/contracts/api/modelosApi.ts` e `estudioApi.ts` — modelos e configuração do estúdio.
- `src/features/galleries/api/galeriasApi.ts` — galerias, mídias, seleção, extras, RAW e entrega.
- `src/features/galleries/api/galeriaUploadApi.ts` — upload de fotos/vídeos e versões editadas com progresso.
- `src/features/finance/api/financeiroApi.ts` e `financeStore.ts` — resumo financeiro mensal consolidado.
- `src/features/dashboard/api/dashboardApi.ts` — visão operacional agregada.
- `src/integrations/acceptance/httpAdapter.ts` — aceite público via token.
- `src/features/clients/store/clientStore.ts`, `packageStore.ts`, `appointmentStore.ts`, `contractStore.ts`, `templateStore.ts` e `studioStore.ts` — mantêm a interface pública usada pelas telas, mas carregam e gravam na API (sem `localStorage`).
- `src/app/useBootstrapData.ts` — hidrata os dados do backend no boot.
- `src/app/applyContractLinks.ts` — reconcilia os vínculos de contrato nos agendamentos.

A numeração (`CT-AAAA-0001`), o snapshot, as cláusulas resolvidas, o histórico, o protocolo de aceite (`ACE-AAAA-0001`) e os pagamentos agora são responsabilidade do backend.

Os módulos de galerias e financeiro agora usam a API real; o navegador não calcula mais os valores financeiros.

## Módulos

- **Login e usuários:** autenticação JWT, troca obrigatória de senha, criação/reset por admin e perfis `Admin`/`Gestor`.
- **Dashboard:** visão do dia com próximos ensaios, pendências e resumo financeiro.
- **Agenda:** ensaios, status, remarcações e detalhes do atendimento.
- **Pacotes:** duração, valor de tabela, fotos/vídeos inclusos, valor da foto extra, faixas opcionais por quantidade e promoção opcional.
- **Contratos:** modelo, aceite por link público, entrada e saldo final.
- **Galerias:** upload de originais, seleção pública, fotos extras, edição e entrega por link.
- **Financeiro:** entradas, saldos finais, extras e previsão do mês.

## Regras principais

### Pacotes e promoção

- Cada pacote define `quantidadeFotosInclusas`, `quantidadeVideosInclusos`, `valorFotoExtra` e, opcionalmente, `faixasFotoExtra`.
- As faixas são aplicadas por volume: a maior faixa atingida define o valor unitário de **todas** as fotos extras da seleção.
  Sem faixa configurada no pacote, vale apenas o valor base. Ex.: base R$15 e faixa 3 → R$10; 2 extras = R$30 e 3 extras = R$30.
- A promoção é um atributo do catálogo (`promocao.valorPromocional`), com validade opcional.
- No momento da venda, o snapshot comercial do ensaio registra se a promoção foi aplicada.
- Alterar o pacote depois não altera ensaios já criados.

### Pagamentos

- **Entrada:** paga na reserva, com comprovante público.
- **Saldo final:** recebido pelo staff via Pix ou dinheiro durante/logo após o ensaio, registrado manualmente no ensaio ou contrato.
- **Fotos extras:** cobradas após a seleção do cliente, confirmadas pelo staff na galeria.

### Galeria

Fluxo:

```
aguardando_upload → em_selecao → selecao_enviada → em_edicao → entregue
```

- A publicação da seleção exige ensaio realizado, entrada e saldo quitados e mídia mínima enviada.
- **Link único:** o cliente usa o mesmo token na seleção e na entrega; a publicação vale 30 dias e o envio da
  seleção estende o link para 90 dias. As rotas antigas `/selecao` e `/entrega` redirecionam para `/galeria`.
- Cada foto recebe um número estável exibido no grid público e no detalhe do staff; o mesmo número nomeia
  o arquivo no ZIP de edição.
- Fotos: o cliente precisa selecionar pelo menos a quantidade inclusa, sem máximo.
- Vídeos: exatamente a quantidade inclusa, sem vídeo extra.
- Fotos acima do incluso geram pedido de extras.
- O staff pode reabrir a seleção mesmo com extras já pagos ou isentos; o novo pedido cobra apenas o delta.
- Fotos e vídeos já entregues ficam bloqueados no link público: o cliente só pode acrescentar novas mídias.
- A compra de extras adicionais é combinada com o staff pelo WhatsApp; a página pública não tem solicitação.
- A edição pode ser liberada manualmente pelo staff, com registro de motivo.
- O staff vê as fotos selecionadas destacadas, a lista de números e pode baixar os originais em
  **ZIP para edição** direto do detalhe da galeria.
- Cada foto pode ser publicada com uma de duas finalidades:
  - **Para edição:** o arquivo enviado é o original; depois da seleção o staff envia a versão editada.
  - **Já editada (pronta):** o arquivo enviado já é a versão final; não existe segunda versão.
  As duas finalidades contam na mesma cota do pacote e nos extras.
- Cada foto **para edição** pode receber uma **versão editada** (JPEG/PNG/WebP até 50 MB). Fotos já editadas não recebem segunda versão: para corrigir, remova a mídia e envie novamente.
- O staff pode enviar as versões editadas **em lote**, associando os arquivos pelo número da foto
  (padrão `001_nome.jpg`) ou pelo nome original, com até 3 uploads simultâneos e reenvio dos que falharem.
- No upload da versão editada há o checkbox **“Liberar automaticamente quando o cliente selecionar”**.
  Ligado, a mídia pronta é liberada após a seleção e a quitação dos extras; desligado, o staff libera manualmente.
- O staff pode **liberar os RAW** de forma explícita, auditada e revogável.
- A entrega é **progressiva**: cada mídia liberada aparece em “Disponíveis” e as demais em “Em liberação”.
  Na seleção, o cliente vê os grupos “Para edição” e “Prontas para baixar”; na entrega, o backend resolve a
  melhor versão sem expor os rótulos técnicos “editada” ou “RAW”.
- **Marca d'água:** todas as prévias de fotos publicadas usam um derivado com o nome do estúdio aplicado
  na imagem. O download entrega sempre o arquivo limpo. Fotos já editadas ficam disponíveis sem marca
  logo após a seleção (e a quitação dos extras, se houver).
- O staff pode liberar em lote, revogar uma liberação e finalizar a entrega; o link único é renovado por 90 dias.
- A entrega baixa as mídias disponíveis, individualmente ou em **ZIP streaming**.

## Mocks de backend

- **Clientes, pacotes, agenda, contratos, galerias, financeiro, dashboard, modelos, estúdio e aceite** já usam a API real.
- Galerias não usam mais Zustand persistido, localStorage ou IndexedDB.
- O upload de fotos e vídeos é feito direto ao Garage/S3 com URLs pré-assinadas, progresso e retomada.

## Rotas

- `/login` — autenticação.
- `/trocar-senha` — troca obrigatória no primeiro acesso.
- `/usuarios` — gestão de usuários (somente `ADMIN`).
- `/assinar/:token` — aceite do contrato (público).
- `/galeria/:token` — galeria pública unificada: seleção, liberação progressiva e download.
- `/selecao/:token` e `/entrega/:token` — redirecionam para `/galeria/:token` (compatibilidade).

## Limitações do protótipo

- Auth com JWT, mas sem MFA e sem reset por e-mail (senha temporária exibida uma vez pelo admin).
- As telas de clientes, pacotes e contratos usam paginação/busca server-side. No boot, loaders de compatibilidade ainda percorrem todas as páginas para alimentar pickers e outras telas; eles serão removidos quando os módulos restantes migrarem.
- Galerias e financeiro já usam a API real.
- Upload de fotos até 50 MB e vídeos até 500 MB, com progresso e URLs assinadas. O processamento de derivados roda em background com polling.
- A entrega baixa arquivos individualmente ou em ZIP; pós-processamento de vídeo fica para a próxima fase.
- O comprovante de pagamento é enviado direto ao Garage/S3 com URLs pré-assinadas, progresso real e limite de 10 MB. O IndexedDB não é mais usado para comprovantes.
- O download do comprovante pelo staff usa URL assinada temporária; a rota será protegida na fase de autenticação.
- A expiração dos links de galeria é validada pelo backend; a UI exibe o prazo e o estado.
- Sem envio automático de WhatsApp ou e-mail.

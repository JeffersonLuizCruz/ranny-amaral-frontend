# Photoizer CRM

CRM para estúdios fotográficos com agenda, clientes, pacotes, contratos, financeiro e galerias de ensaio.

## Como rodar

O frontend consome a API real para **clientes**, **pacotes**, **agenda**, **contratos**, **galerias**, **modelos**, **estúdio** e **aceite público**. Suba o backend primeiro:

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

Validação:

```bash
npm run typecheck
npm run lint
npm run build
```

O CI (`.github/workflows/ci.yml`) executa `npm ci`, `npm run lint` e `npm run build`.

## Integração com o backend

- `src/shared/api/httpClient.ts` — cliente HTTP único, baseURL `/api/v1`, tratamento do `ErrorResponse` do backend.
- `src/shared/api/types.ts` e `src/shared/components/ui/Paginador.tsx` — envelope `Pagina<T>` e controle reutilizável de paginação.
- `src/shared/upload/*` — hash SHA-256, upload direto ao storage com progresso, cancelamento e retry.
- `src/features/contracts/api/comprovanteApi.ts` — fluxo de upload do comprovante público.
- `src/features/clients/api/clientesApi.ts` — CRUD e listagem paginada de clientes.
- `src/features/packages/api/pacotesApi.ts` — CRUD, alternância de situação e listagem paginada dos pacotes.
- `src/features/appointments/api/agendaApi.ts` — CRUD, status, pagamentos, listagem paginada e calendário por período.
- `src/features/contracts/api/contratosApi.ts` — contratos, busca paginada, links de aceite e pagamentos.
- `src/features/contracts/api/modelosApi.ts` e `estudioApi.ts` — modelos e configuração do estúdio.
- `src/integrations/acceptance/httpAdapter.ts` — aceite público via token.
- `src/features/clients/store/clientStore.ts`, `packageStore.ts`, `appointmentStore.ts`, `contractStore.ts`, `templateStore.ts` e `studioStore.ts` — mantêm a interface pública usada pelas telas, mas carregam e gravam na API (sem `localStorage`).
- `src/app/useBootstrapData.ts` — hidrata os dados do backend no boot.
- `src/app/applyContractLinks.ts` — reconcilia os vínculos de contrato nos agendamentos.

A numeração (`CT-AAAA-0001`), o snapshot, as cláusulas resolvidas, o histórico, o protocolo de aceite (`ACE-AAAA-0001`) e os pagamentos agora são responsabilidade do backend.

O módulo de galerias agora usa a API real; financeiro continua local nesta fase. A migração do financeiro será feita na próxima etapa.

## Módulos

- **Agenda:** ensaios, status, remarcações e detalhes do atendimento.
- **Pacotes:** duração, valor de tabela, fotos/vídeos inclusos, valor da foto extra e promoção opcional.
- **Contratos:** modelo, aceite por link público, entrada e saldo final.
- **Galerias:** upload de originais, seleção pública, fotos extras, edição e entrega por link.
- **Financeiro:** entradas, saldos finais, extras e previsão do mês.

## Regras principais

### Pacotes e promoção

- Cada pacote define `quantidadeFotosInclusas`, `quantidadeVideosInclusos` e `valorFotoExtra`.
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
aguardando_upload → em_selecao → selecao_enviada → em_edicao → pronta_entrega → entregue
```

- A publicação da seleção exige ensaio realizado, entrada e saldo quitados e mídia mínima enviada.
- Link de seleção: 30 dias, reabrindo o mesmo token.
- Fotos: o cliente precisa selecionar pelo menos a quantidade inclusa, sem máximo.
- Vídeos: exatamente a quantidade inclusa, sem vídeo extra.
- Fotos acima do incluso geram pedido de extras.
- A edição pode ser liberada manualmente pelo staff, com registro de motivo.
- A entrega exige extras pagos ou isentos.
- Link de entrega: 90 dias, com downloads registrados.

## Mocks de backend

- **Clientes, pacotes, agenda, contratos, galerias, modelos, estúdio e aceite** já usam a API real.
- Galerias não usam mais Zustand persistido, localStorage ou IndexedDB.
- O upload de fotos e vídeos é feito direto ao MinIO/S3 com URLs pré-assinadas, progresso e retomada.

## Rotas públicas

- `/assinar/:token` — aceite do contrato.
- `/selecao/:token` — seleção de fotos e vídeos.
- `/entrega/:token` — download da entrega editada.

## Limitações do protótipo

- Sem autenticação.
- As telas de clientes, pacotes e contratos usam paginação/busca server-side. No boot, loaders de compatibilidade ainda percorrem todas as páginas para alimentar pickers, galerias e financeiro; eles serão removidos quando esses módulos migrarem.
- Galerias já usam a API real; financeiro ainda usa Zustand/localStorage.
- Upload de fotos até 50 MB e vídeos até 500 MB, com progresso e URLs assinadas. O processamento de derivados é síncrono nesta versão.
- A entrega baixa arquivos individualmente; ZIP e pós-processamento de vídeo ficam para a próxima fase.
- O comprovante de pagamento é enviado direto ao MinIO com URLs pré-assinadas, progresso real e limite de 10 MB. O IndexedDB não é mais usado para comprovantes.
- O download do comprovante pelo staff usa URL assinada temporária; a rota será protegida na fase de autenticação.
- Download em ZIP não implementado; a entrega baixa os arquivos individualmente.
- Expiração de links de galeria é simulada localmente.
- Sem envio automático de WhatsApp ou e-mail.

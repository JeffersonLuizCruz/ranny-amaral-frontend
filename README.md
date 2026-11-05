# Photoizer CRM

CRM para estúdios fotográficos com agenda, clientes, pacotes, contratos, financeiro e galerias de ensaio.

## Como rodar

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm run lint
npm run build
```

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

- `src/integrations/gallery/localAdapter.ts`: adapter local de galeria.
- `src/integrations/gallery/httpAdapter.ts`: stub para o backend real.
- `VITE_GALLERY_ADAPTER=http` troca o adapter.
- Metadados ficam no Zustand/localStorage; blobs de fotos e vídeos ficam no IndexedDB (`photoizer-crm`).
- `src/integrations/storage/indexedDb.ts` centraliza o banco e evita conflito de versão com comprovantes.

## Rotas públicas

- `/assinar/:token` — aceite do contrato.
- `/selecao/:token` — seleção de fotos e vídeos.
- `/entrega/:token` — download da entrega editada.

## Limitações do protótipo

- Sem autenticação e sem backend real.
- Arquivos ficam no IndexedDB do navegador; o link só funciona no mesmo navegador/perfil.
- Download em ZIP não implementado; a entrega baixa os arquivos individualmente.
- Expiração de links é simulada localmente.
- Sem envio automático de WhatsApp ou e-mail.

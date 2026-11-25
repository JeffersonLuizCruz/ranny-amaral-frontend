# AGENTS.md - SPA do CRM

React 19, TypeScript 7, Vite 8, Tailwind 4, Zustand, React Router 7.

Rode sempre dentro deste diretório. Nunca `npm` na raiz do workspace.

## Comandos

| Objetivo | Comando |
|---|---|
| Instalar | `npm install` |
| Dev (proxy `/api` -> `:8080`) | `npm run dev` |
| Tipos | `npm run typecheck` |
| Lint | `npm run lint` |
| Testes | `npm test` |
| Build | `npm run build` |

Validação mínima antes de concluir qualquer tarefa:
`npm run typecheck && npm run lint && npm test && npm run build`.

Node 22 no CI. Tailwind 4 via `@tailwindcss/vite`.

## Estrutura

```
src/
├── app/          App, router, layout, bootstrap
├── domain/       tipos e regras puras (sem rede)
├── features/     uma pasta por área
│   └── <feature>/{api,components,hooks,lib,store}
├── shared/       api, components/ui, hooks, lib, store, upload
└── test/         setup do Vitest
```

Pastas de feature em inglês (`clients`, `contracts`, `galleries`). Prosa em pt-BR.

## Rede

- `src/shared/api/httpClient.ts` é o cliente HTTP único, com baseURL `/api/v1`.
- Não crie `fetch` ou `axios` paralelo.
- Listagens usam `Pagina<T>` e o componente `Paginador`.
- Paginação e busca são server-side.

## Estado

- Zustand mantém a interface das telas e persiste na API.
- Não guarde dados de servidor em `localStorage`/`IndexedDB`.
- `useBootstrapData` e `applyContractLinks` são compatibilidade; não amplie.

## Tipos

- `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`,
  `erasableSyntaxOnly`.
- Imports internos sempre com `@/`.
- Regra de domínio pura em `src/domain/`, sem chamada de rede.

## Upload

- Sempre por URL pré-assinada, direto ao storage.
- Componente em `src/shared/upload/`.
- Acima de 5 MiB, multipart.

## Testes

- Vitest + Testing Library + jsdom; setup em `src/test/setup.ts`.
- Regras puras têm teste ao lado, em `src/domain/*.test.ts`.

## Armadilhas

- Criar segundo cliente HTTP.
- Recalcular valores financeiros no navegador: o backend é a autoridade.
- Reintroduzir dados mockados ou `localStorage` em galerias.
- Esquecer o alias `@/`.
- Alterar `VITE_API_URL` esperando efeito em runtime: ela é resolvida no build.

## Contexto de projeto

O domínio consolidado, os runbooks e o pipeline de release ficam no vault ICM em
`../icm-vault`. Para tarefas de código, este arquivo e o `README.md` bastam.

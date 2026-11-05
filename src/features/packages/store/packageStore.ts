import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createSeedData } from '@/domain/seed'
import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.packages.v1'

function inferQuantidade(itens: string[], pattern: RegExp): number {
  const text = itens.join(' ')
  const match = text.match(pattern)
  const value = match?.[1] ? Number(match[1]) : 0
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function normalizePackage(pacote: PacoteFotografico): PacoteFotografico {
  const quantidadeFotosInclusas =
    pacote.quantidadeFotosInclusas ??
    inferQuantidade(pacote.itensInclusos, /(\d+)\s*fotos?/i)
  const quantidadeVideosInclusos =
    pacote.quantidadeVideosInclusos ??
    inferQuantidade(pacote.itensInclusos, /(\d+)\s*v[ií]deos?/i)

  return {
    ...pacote,
    quantidadeFotosInclusas,
    quantidadeVideosInclusos,
    valorFotoExtra:
      pacote.valorFotoExtra ??
      (quantidadeFotosInclusas > 0
        ? Math.round((pacote.valor / quantidadeFotosInclusas) * 100) / 100
        : 0),
    promocao: pacote.promocao?.ativa ? pacote.promocao : undefined,
  }
}

interface PackageState {
  pacotes: PacoteFotografico[]
  createPackage: (draft: PacoteDraft) => PacoteFotografico
  updatePackage: (id: string, draft: PacoteDraft) => void
  deletePackage: (id: string) => void
  togglePackageActive: (id: string) => void
  restoreDemoData: () => void
}

const seed = createSeedData()

export const usePackageStore = create<PackageState>()(
  persist(
    (setState) => ({
      pacotes: seed.packages,

      createPackage: (draft) => {
        const timestamp = new Date().toISOString()
        const pacote: PacoteFotografico = normalizePackage({
          ...draft,
          id: createId('pkg'),
          createdAt: timestamp,
          updatedAt: timestamp,
        })

        setState((state) => ({ pacotes: [...state.pacotes, pacote] }))
        return pacote
      },

      updatePackage: (id, draft) => {
        setState((state) => ({
          pacotes: state.pacotes.map((pacote) =>
            pacote.id === id
              ? normalizePackage({
                  ...pacote,
                  ...draft,
                  updatedAt: new Date().toISOString(),
                })
              : pacote,
          ),
        }))
      },

      deletePackage: (id) => {
        setState((state) => ({
          pacotes: state.pacotes.filter((pacote) => pacote.id !== id),
        }))
      },

      togglePackageActive: (id) => {
        setState((state) => ({
          pacotes: state.pacotes.map((pacote) =>
            pacote.id === id
              ? { ...pacote, ativo: !pacote.ativo, updatedAt: new Date().toISOString() }
              : pacote,
          ),
        }))
      },

      restoreDemoData: () => {
        setState({ pacotes: createSeedData().packages })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { pacotes?: PacoteFotografico[] } | undefined
        return {
          pacotes: (state?.pacotes ?? []).map(normalizePackage),
        }
      },
      partialize: (state) => ({ pacotes: state.pacotes }),
    },
  ),
)

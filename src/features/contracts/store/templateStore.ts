import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createContractSeedData } from '@/domain/contractSeed'
import type {
  ModeloContrato,
  ModeloContratoDraft,
} from '@/domain/contracts'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.contract-templates.v2'

interface TemplateState {
  modelos: ModeloContrato[]
  createTemplate: (draft: ModeloContratoDraft) => ModeloContrato
  updateTemplate: (id: string, draft: ModeloContratoDraft) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => ModeloContrato | null
  toggleTemplateActive: (id: string) => void
  restoreDemoData: () => void
}

const seed = createContractSeedData()

export const useTemplateStore = create<TemplateState>()(
  persist(
    (setState, getState) => ({
      modelos: seed.templates,

      createTemplate: (draft) => {
        const timestamp = new Date().toISOString()
        const modelo: ModeloContrato = {
          ...draft,
          id: createId('tpl'),
          versao: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        setState((state) => ({ modelos: [modelo, ...state.modelos] }))
        return modelo
      },

      updateTemplate: (id, draft) => {
        setState((state) => ({
          modelos: state.modelos.map((modelo) =>
            modelo.id === id
              ? {
                  ...modelo,
                  ...draft,
                  versao: modelo.versao + 1,
                  updatedAt: new Date().toISOString(),
                }
              : modelo,
          ),
        }))
      },

      deleteTemplate: (id) => {
        setState((state) => ({
          modelos: state.modelos.filter((modelo) => modelo.id !== id),
        }))
      },

      duplicateTemplate: (id) => {
        const original = getState().modelos.find((modelo) => modelo.id === id)
        if (!original) return null

        const timestamp = new Date().toISOString()
        const modelo: ModeloContrato = {
          ...original,
          id: createId('tpl'),
          nome: `${original.nome} (cópia)`,
          versao: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
          clausulas: original.clausulas.map((clausula) => ({
            ...clausula,
            id: createId('cl'),
          })),
        }

        setState((state) => ({ modelos: [modelo, ...state.modelos] }))
        return modelo
      },

      toggleTemplateActive: (id) => {
        setState((state) => ({
          modelos: state.modelos.map((modelo) =>
            modelo.id === id
              ? { ...modelo, ativo: !modelo.ativo, updatedAt: new Date().toISOString() }
              : modelo,
          ),
        }))
      },

      restoreDemoData: () => {
        setState({ modelos: createContractSeedData().templates })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({ modelos: state.modelos }),
    },
  ),
)

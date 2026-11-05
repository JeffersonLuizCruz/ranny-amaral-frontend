import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createContractSeedData } from '@/domain/contractSeed'
import type { EstudioConfig } from '@/domain/contracts'

const STORAGE_KEY = 'photoizer.crm.studio.v2'

interface StudioState {
  estudio: EstudioConfig
  updateEstudio: (config: EstudioConfig) => void
  restoreDemoData: () => void
}

const seed = createContractSeedData()

export const useStudioStore = create<StudioState>()(
  persist(
    (setState) => ({
      estudio: seed.studio,

      updateEstudio: (config) => {
        setState({ estudio: config })
      },

      restoreDemoData: () => {
        setState({ estudio: createContractSeedData().studio })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({ estudio: state.estudio }),
    },
  ),
)

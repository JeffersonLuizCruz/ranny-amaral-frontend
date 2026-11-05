import type { GaleriaEnsaio } from './galleries'
import { createSeedData } from './seed'

/**
 * Galeria de demonstração criada para o ensaio já realizado.
 * As mídias ficam vazias de propósito: os arquivos vivem no IndexedDB do navegador.
 */
export function createGallerySeedData(): GaleriaEnsaio[] {
  const seed = createSeedData()
  const appointment = seed.appointments.find((item) => item.id === 'apt-003')
  if (!appointment) return []

  const timestamp = new Date().toISOString()

  return [
    {
      id: 'gal-001',
      agendamentoId: appointment.id,
      contratoId: appointment.contratoId,
      status: 'aguardando_upload',
      midias: [],
      historico: [
        {
          id: 'evt-gal-001',
          tipo: 'criada',
          em: timestamp,
          detalhe: 'Galeria criada após a realização do ensaio.',
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

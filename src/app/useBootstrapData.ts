import { useEffect } from 'react'

import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { useTemplateStore } from '@/features/contracts/store/templateStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'

/**
 * Carrega os dados servidos pelo backend no boot da aplicação.
 *
 * Contratos e agenda são fontes independentes da API; a sincronização entre
 * eles é responsabilidade do backend, via evento de contrato.
 */
export function useBootstrapData() {
  const carregarClientes = useClientStore((state) => state.carregarClientes)
  const carregarPacotes = usePackageStore((state) => state.carregarPacotes)
  const carregarAgendamentos = useAppointmentStore((state) => state.carregarAgendamentos)
  const carregarContratos = useContractStore((state) => state.carregarContratos)
  const carregarModelos = useTemplateStore((state) => state.carregarModelos)
  const carregarEstudio = useStudioStore((state) => state.carregarEstudio)
  const carregarGalerias = useGalleryStore((state) => state.carregarGalerias)
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    let ativo = true

    Promise.all([
      carregarClientes(),
      carregarPacotes(),
      carregarAgendamentos(),
      carregarContratos(),
      carregarModelos(),
      carregarEstudio(),
      carregarGalerias({ tamanho: 100 }),
    ])
      .catch((error) => {
        if (ativo) addToast(mensagemDeErro(error))
      })

    return () => {
      ativo = false
    }
  }, [
    addToast,
    carregarAgendamentos,
    carregarClientes,
    carregarContratos,
    carregarEstudio,
    carregarGalerias,
    carregarModelos,
    carregarPacotes,
  ])
}

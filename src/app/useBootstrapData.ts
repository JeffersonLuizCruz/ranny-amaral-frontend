import { useEffect } from 'react'

import { aplicarVinculosDeContratos } from '@/app/applyContractLinks'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { useTemplateStore } from '@/features/contracts/store/templateStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'

/**
 * Carrega os dados servidos pelo backend no boot da aplicação.
 *
 * Clientes, pacotes, agenda, contratos, modelos e estúdio já usam a API.
 * As listagens de clientes/pacotes/agenda/contratos são paginadas; aqui os
 * loaders percorrem todas as páginas de forma transitória para manter pickers,
 * galerias e financeiro funcionando até a migração desses módulos.
 */
export function useBootstrapData() {
  const carregarClientes = useClientStore((state) => state.carregarClientes)
  const carregarPacotes = usePackageStore((state) => state.carregarPacotes)
  const carregarAgendamentos = useAppointmentStore((state) => state.carregarAgendamentos)
  const carregarContratos = useContractStore((state) => state.carregarContratos)
  const carregarModelos = useTemplateStore((state) => state.carregarModelos)
  const carregarEstudio = useStudioStore((state) => state.carregarEstudio)
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
    ])
      .then(() => {
        if (ativo) aplicarVinculosDeContratos()
      })
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
    carregarModelos,
    carregarPacotes,
  ])
}

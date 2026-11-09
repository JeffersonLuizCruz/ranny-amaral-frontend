import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { appointmentStatusFromContract } from '@/features/contracts/lib/status'
import { useContractStore } from '@/features/contracts/store/contractStore'

/**
 * Reconcilia os vínculos dos contratos locais nos agendamentos da API.
 *
 * Etapa transitória: enquanto o módulo de contratos não usa o backend, o
 * agendamento remoto não conhece `contratoId`, `clienteId` nem os pagamentos
 * espelhados. Este passo reaplica esses dados no store da agenda após cada
 * carga (boot e restauração de demonstração).
 */
export function aplicarVinculosDeContratos() {
  const vinculos = useContractStore.getState().contratos.flatMap((contrato) => {
    if (!contrato.agendamentoId) return []
    return [
      {
        contratoId: contrato.id,
        agendamentoId: contrato.agendamentoId,
        clienteId: contrato.clienteId,
        status: appointmentStatusFromContract(contrato),
        pagamentoEntrada: contrato.pagamento,
        pagamentoFinal: contrato.pagamentoFinal,
        statusEntrada: contrato.statusEntrada,
        statusSaldoFinal: contrato.statusSaldoFinal,
        entradaQuitada: contrato.entradaQuitada,
        saldoQuitado: contrato.saldoQuitado,
        quitado: contrato.quitado,
        valorRecebido: contrato.valorRecebido,
        valorPendente: contrato.valorPendente,
      },
    ]
  })

  useAppointmentStore.getState().aplicarVinculos(vinculos)
}

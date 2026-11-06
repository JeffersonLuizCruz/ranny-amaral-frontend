import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import type { FormaPagamentoSaldo } from '@/domain/payments'
import type { AgendamentoEnsaio } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, selectClass, textareaClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { formatBRL, parseCurrencyInput } from '@/shared/lib/currency'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useContractStore } from '@/features/contracts/store/contractStore'

interface FinalPaymentDialogProps {
  open: boolean
  appointment?: AgendamentoEnsaio
  contrato?: Contrato
  onClose: () => void
}

const FORMAS: Array<{ value: FormaPagamentoSaldo; label: string }> = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro em mãos' },
  { value: 'outro', label: 'Outro' },
]

export function FinalPaymentDialog({
  open,
  appointment,
  contrato,
  onClose,
}: FinalPaymentDialogProps) {
  const registrarPagamentoFinal = useContractStore(
    (state) => state.registrarPagamentoFinal,
  )
  const setPaymentFinal = useAppointmentStore((state) => state.setPaymentFinal)
  const addToast = useToastStore((state) => state.addToast)

  const saldo = contrato?.saldoRestante ?? appointment?.saldoRestante ?? 0
  const [valor, setValor] = useState(() => String(saldo))
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoSaldo>('pix')
  const [recebidoEm, setRecebidoEm] = useState(() => new Date().toISOString().slice(0, 10))
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const valorRecebido = parseCurrencyInput(valor)

    if (!Number.isFinite(valorRecebido) || valorRecebido <= 0) {
      setErro('Informe um valor recebido maior que zero.')
      return
    }
    if (!recebidoEm) {
      setErro('Informe a data do recebimento.')
      return
    }

    const dataRecebimento = new Date(`${recebidoEm}T12:00:00`)
    if (Number.isNaN(dataRecebimento.getTime())) {
      setErro('Informe uma data válida.')
      return
    }

    const recebidoEmIso = dataRecebimento.toISOString()

    try {
      if (contrato) {
        registrarPagamentoFinal(contrato.id, {
          valor: valorRecebido,
          formaPagamento,
          recebidoEm: recebidoEmIso,
          observacoes: observacoes.trim() || undefined,
        })
      } else if (appointment) {
        await setPaymentFinal(appointment.id, {
          valor: valorRecebido,
          status: 'confirmado',
          formaPagamento,
          recebidoEm: recebidoEmIso,
          recebidoPor: 'Equipe do estúdio',
          observacoes: observacoes.trim() || undefined,
        })
      }

      addToast(`Saldo final de ${formatBRL(valorRecebido)} registrado.`)
      onClose()
    } catch (error) {
      setErro(mensagemDeErro(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar saldo final"
      description="O saldo é recebido pelo staff durante ou logo após o ensaio."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="rounded-xl bg-canvas/70 px-3 py-2 text-[11px] text-muted ring-1 ring-line">
          Saldo previsto: <span className="font-semibold text-ink">{formatBRL(saldo)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor recebido (R$)" htmlFor="final-payment-value">
            <input
              id="final-payment-value"
              data-autofocus
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={valor}
              onChange={(event) => {
                setValor(event.target.value)
                setErro('')
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Data do recebimento" htmlFor="final-payment-date">
            <input
              id="final-payment-date"
              type="date"
              value={recebidoEm}
              onChange={(event) => setRecebidoEm(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Forma de pagamento" htmlFor="final-payment-method">
          <select
            id="final-payment-method"
            value={formaPagamento}
            onChange={(event) =>
              setFormaPagamento(event.target.value as FormaPagamentoSaldo)
            }
            className={selectClass}
          >
            {FORMAS.map((forma) => (
              <option key={forma.value} value={forma.value}>
                {forma.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Observação" htmlFor="final-payment-notes">
          <textarea
            id="final-payment-notes"
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            placeholder="Opcional: quem recebeu, conferência de caixa etc."
            rows={2}
            className={textareaClass}
          />
        </Field>

        {erro ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {erro}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Check className="size-4" />
            Confirmar recebimento
          </Button>
        </div>
      </form>
    </Modal>
  )
}

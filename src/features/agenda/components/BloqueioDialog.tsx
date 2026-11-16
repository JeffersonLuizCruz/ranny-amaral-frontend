import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Trash2 } from 'lucide-react'

import type { BloqueioAgenda, BloqueioAgendaDraft } from '@/domain/types'
import { mensagemDeErro } from '@/shared/api/errors'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { useToastStore } from '@/shared/store/toastStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useBloqueioStore } from '@/features/agenda/store/bloqueioStore'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

interface BloqueioFormErrors {
  data?: string
  horaInicio?: string
  horaFim?: string
  motivo?: string
}

export function BloqueioDialog() {
  const aberto = useAgendaStore((state) => state.bloqueioDialogAberto)
  const bloqueio = useAgendaStore((state) => state.bloqueioEditando)
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const close = useAgendaStore((state) => state.closeBloqueioDialog)

  return (
    <Modal
      open={aberto}
      onClose={close}
      title={bloqueio ? 'Editar bloqueio' : 'Bloquear data/horário'}
      description="Novos ensaios não poderão ser marcados neste período."
    >
      {aberto ? (
        <BloqueioForm
          key={bloqueio?.id ?? `novo-${selectedDate}`}
          bloqueio={bloqueio}
          defaultDate={selectedDate}
          onClose={close}
        />
      ) : null}
    </Modal>
  )
}

interface BloqueioFormProps {
  bloqueio: BloqueioAgenda | null
  defaultDate: string
  onClose: () => void
}

function BloqueioForm({ bloqueio, defaultDate, onClose }: BloqueioFormProps) {
  const criar = useBloqueioStore((state) => state.criar)
  const atualizar = useBloqueioStore((state) => state.atualizar)
  const excluir = useBloqueioStore((state) => state.excluir)
  const addToast = useToastStore((state) => state.addToast)

  const [diaInteiro, setDiaInteiro] = useState(bloqueio?.diaInteiro ?? false)
  const [data, setData] = useState(bloqueio?.data ?? defaultDate)
  const [horaInicio, setHoraInicio] = useState(bloqueio?.horaInicio ?? '09:00')
  const [horaFim, setHoraFim] = useState(
    bloqueio?.horaFim === '00:00' ? '18:00' : (bloqueio?.horaFim ?? '18:00'),
  )
  const [motivo, setMotivo] = useState(bloqueio?.motivo ?? '')
  const [errors, setErrors] = useState<BloqueioFormErrors>({})
  const [salvando, setSalvando] = useState(false)

  const validar = (): BloqueioAgendaDraft | null => {
    const proximos: BloqueioFormErrors = {}

    if (!data) proximos.data = 'Escolha a data do bloqueio.'
    if (!motivo.trim()) proximos.motivo = 'Informe o motivo do bloqueio.'

    if (!diaInteiro) {
      if (!TIME_PATTERN.test(horaInicio)) {
        proximos.horaInicio = 'Informe um horário válido.'
      }
      if (!TIME_PATTERN.test(horaFim)) {
        proximos.horaFim = 'Informe um horário válido.'
      }
      if (
        TIME_PATTERN.test(horaInicio) &&
        TIME_PATTERN.test(horaFim) &&
        horaFim <= horaInicio
      ) {
        proximos.horaFim = 'O fim deve ser posterior ao início.'
      }
    }

    setErrors(proximos)
    if (Object.keys(proximos).length > 0) return null

    return {
      data,
      diaInteiro,
      horaInicio: diaInteiro ? undefined : horaInicio,
      horaFim: diaInteiro ? undefined : horaFim,
      motivo: motivo.trim(),
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const draft = validar()
    if (!draft) return

    setSalvando(true)
    try {
      if (bloqueio) {
        await atualizar(bloqueio.id, draft)
        addToast('Bloqueio atualizado.')
      } else {
        await criar(draft)
        addToast('Data/horário bloqueado.')
      }
      onClose()
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setSalvando(false)
    }
  }

  const handleDelete = async () => {
    if (!bloqueio) return
    if (!window.confirm('Excluir este bloqueio? O horário voltará a aceitar ensaios.')) return

    setSalvando(true)
    try {
      await excluir(bloqueio.id)
      addToast('Bloqueio excluído.')
      onClose()
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="group"
        aria-label="Tipo de bloqueio"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {[
          { valor: false, rotulo: 'Intervalo' },
          { valor: true, rotulo: 'Dia inteiro' },
        ].map((opcao) => (
          <button
            key={opcao.rotulo}
            type="button"
            aria-pressed={diaInteiro === opcao.valor}
            onClick={() => {
              setDiaInteiro(opcao.valor)
              setErrors({})
            }}
            className={cn(
              'h-9 rounded-lg text-xs font-medium transition',
              diaInteiro === opcao.valor
                ? 'bg-surface text-brand-700 shadow-sm ring-1 ring-brand-100'
                : 'text-muted hover:text-ink',
            )}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <Field label="Data" htmlFor="bloqueio-data" error={errors.data}>
        <input
          id="bloqueio-data"
          type="date"
          value={data}
          onChange={(event) => {
            setData(event.target.value)
            setErrors((atual) => ({ ...atual, data: undefined }))
          }}
          className={inputClass}
          data-autofocus
        />
      </Field>

      {!diaInteiro ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" htmlFor="bloqueio-inicio" error={errors.horaInicio}>
            <input
              id="bloqueio-inicio"
              type="time"
              value={horaInicio}
              onChange={(event) => {
                setHoraInicio(event.target.value)
                setErrors((atual) => ({ ...atual, horaInicio: undefined }))
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Fim" htmlFor="bloqueio-fim" error={errors.horaFim}>
            <input
              id="bloqueio-fim"
              type="time"
              value={horaFim}
              onChange={(event) => {
                setHoraFim(event.target.value)
                setErrors((atual) => ({ ...atual, horaFim: undefined }))
              }}
              className={inputClass}
            />
          </Field>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
          O dia inteiro ficará indisponível para novos ensaios.
        </p>
      )}

      <Field label="Motivo" htmlFor="bloqueio-motivo" error={errors.motivo}>
        <input
          id="bloqueio-motivo"
          type="text"
          maxLength={255}
          value={motivo}
          onChange={(event) => {
            setMotivo(event.target.value)
            setErrors((atual) => ({ ...atual, motivo: undefined }))
          }}
          placeholder="Ex.: feriado, viagem, manutenção do estúdio"
          className={inputClass}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        {bloqueio ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={salvando}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        ) : (
          <span />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={salvando}>
            <Lock className="size-3.5" />
            {bloqueio ? 'Salvar bloqueio' : 'Bloquear'}
          </Button>
        </div>
      </div>
    </form>
  )
}

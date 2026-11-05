import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'

import { ORIGEM_OPTIONS } from '@/domain/constants'
import type { Cliente, ClienteDraft } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, selectClass, textareaClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { formatWhatsApp } from '@/shared/lib/whatsapp'
import {
  clientToFormValues,
  createEmptyClientValues,
  validateClientForm,
  type ClientFormErrors,
  type ClientFormValues,
} from '@/features/clients/lib/validation'

interface ClientFormProps {
  open: boolean
  cliente?: Cliente
  onClose: () => void
  onSubmit: (draft: ClienteDraft) => void
}

export function ClientForm({ open, cliente, onClose, onSubmit }: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>(() =>
    cliente ? clientToFormValues(cliente) : createEmptyClientValues(),
  )
  const [errors, setErrors] = useState<ClientFormErrors>({})
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => nameRef.current?.focus(), 60)
    return () => window.clearTimeout(timeout)
  }, [open])

  const update = (patch: Partial<ClientFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as Array<keyof ClientFormValues>) {
        if (key === 'nome' || key === 'whatsapp' || key === 'email') {
          delete next[key]
        }
      }
      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateClientForm(values)

    if (!result.draft) {
      setErrors(result.errors)
      return
    }

    onSubmit(result.draft)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cliente ? 'Editar cliente' : 'Novo cliente'}
      description="Dados de contato usados nos ensaios e nos lembretes."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nome completo" htmlFor="client-name" error={errors.nome}>
          <input
            id="client-name"
            ref={nameRef}
            value={values.nome}
            onChange={(event) => update({ nome: event.target.value })}
            placeholder="Ex.: Marina Alves"
            className={inputClass}
            aria-invalid={Boolean(errors.nome)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp (opcional)" htmlFor="client-whatsapp" error={errors.whatsapp}>
            <input
              id="client-whatsapp"
              value={values.whatsapp}
              onChange={(event) => update({ whatsapp: event.target.value })}
              onBlur={() => update({ whatsapp: formatWhatsApp(values.whatsapp) })}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className={inputClass}
              aria-invalid={Boolean(errors.whatsapp)}
            />
          </Field>

          <Field label="E-mail" htmlFor="client-email" error={errors.email}>
            <input
              id="client-email"
              type="email"
              value={values.email}
              onChange={(event) => update({ email: event.target.value })}
              placeholder="cliente@email.com"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <Field label="Documento" htmlFor="client-document-type">
            <select
              id="client-document-type"
              value={values.tipoDocumento}
              onChange={(event) =>
                update({ tipoDocumento: event.target.value as 'rg' | 'cpf' })
              }
              className={selectClass}
            >
              <option value="cpf">CPF</option>
              <option value="rg">RG</option>
            </select>
          </Field>

          <Field label="Número do documento" htmlFor="client-document">
            <input
              id="client-document"
              value={values.documento}
              onChange={(event) => update({ documento: event.target.value })}
              placeholder={values.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000-0'}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Cidade" htmlFor="client-city">
          <input
            id="client-city"
            value={values.cidade}
            onChange={(event) => update({ cidade: event.target.value })}
            placeholder="Cidade do cliente"
            className={inputClass}
          />
        </Field>

        <Field label="Origem" htmlFor="client-origin">
          <select
            id="client-origin"
            value={values.origem}
            onChange={(event) =>
              update({ origem: event.target.value as ClientFormValues['origem'] })
            }
            className={selectClass}
          >
            {ORIGEM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Observações" htmlFor="client-notes">
          <textarea
            id="client-notes"
            value={values.observacoes}
            onChange={(event) => update({ observacoes: event.target.value })}
            placeholder="Preferências, histórico e detalhes importantes"
            rows={3}
            className={textareaClass}
          />
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Check className="size-4" />
            {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

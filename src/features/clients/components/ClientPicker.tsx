import { useMemo, useState } from 'react'
import { Plus, Search, UserPlus, X } from 'lucide-react'

import { ORIGEM_OPTIONS } from '@/domain/constants'
import type { ClienteDraft } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, selectClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { getInitials } from '@/shared/lib/text'
import { formatWhatsApp } from '@/shared/lib/whatsapp'
import {
  createEmptyClientValues,
  validateClientForm,
  type ClientFormErrors,
  type ClientFormValues,
} from '@/features/clients/lib/validation'
import { useClientStore } from '@/features/clients/store/clientStore'

interface ClientPickerProps {
  value: string
  onChange: (clienteId: string) => void
  error?: string
}

export function ClientPicker({ value, onChange, error }: ClientPickerProps) {
  const clientes = useClientStore((state) => state.clientes)
  const createClient = useClientStore((state) => state.createClient)

  const selected = clientes.find((cliente) => cliente.id === value)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newValues, setNewValues] = useState<ClientFormValues>(() => createEmptyClientValues())
  const [newErrors, setNewErrors] = useState<ClientFormErrors>({})

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return clientes.slice(0, 6)

    const digits = term.replace(/\D/g, '')

    return clientes
      .filter(
        (cliente) =>
          cliente.nome.toLowerCase().includes(term) ||
          (digits.length > 0 && cliente.whatsapp.replace(/\D/g, '').includes(digits)),
      )
      .slice(0, 6)
  }, [clientes, query])

  const updateNew = (patch: Partial<ClientFormValues>) => {
    setNewValues((current) => ({ ...current, ...patch }))
    setNewErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as Array<keyof ClientFormValues>) {
        if (key === 'nome' || key === 'whatsapp' || key === 'email') {
          delete next[key]
        }
      }
      return next
    })
  }

  const handleCreate = () => {
    const result = validateClientForm(newValues)
    if (!result.draft) {
      setNewErrors(result.errors)
      return
    }

    const cliente = createClient(result.draft as ClienteDraft)
    onChange(cliente.id)
    setCreating(false)
    setNewValues(createEmptyClientValues())
    setNewErrors({})
  }

  if (selected) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {getInitials(selected.nome)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{selected.nome}</p>
            <p className="truncate text-xs text-muted">
              {selected.whatsapp || 'WhatsApp não informado'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Trocar cliente"
            onClick={() => onChange('')}
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!creating ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              data-autofocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente por nome ou WhatsApp"
              className={cn(inputClass, 'pl-10')}
              aria-label="Buscar cliente"
            />
          </div>

          <div className="max-h-52 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted">
                Nenhum cliente encontrado.
              </p>
            ) : (
              filtered.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => onChange(cliente.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                    {getInitials(cliente.nome)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {cliente.nome}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {cliente.whatsapp || 'WhatsApp não informado'}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition hover:underline"
          >
            <UserPlus className="size-3.5" />
            Cadastrar novo cliente
          </button>
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink">Cadastro rápido de cliente</p>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="text-[11px] font-medium text-muted transition hover:text-ink"
            >
              Cancelar
            </button>
          </div>

          <Field label="Nome" htmlFor="inline-client-name" error={newErrors.nome}>
            <input
              id="inline-client-name"
              data-autofocus
              value={newValues.nome}
              onChange={(event) => updateNew({ nome: event.target.value })}
              placeholder="Nome do cliente"
              className={inputClass}
              aria-invalid={Boolean(newErrors.nome)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="WhatsApp"
              htmlFor="inline-client-whatsapp"
              error={newErrors.whatsapp}
            >
              <input
                id="inline-client-whatsapp"
                value={newValues.whatsapp}
                onChange={(event) => updateNew({ whatsapp: event.target.value })}
                onBlur={() => updateNew({ whatsapp: formatWhatsApp(newValues.whatsapp) })}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                className={inputClass}
                aria-invalid={Boolean(newErrors.whatsapp)}
              />
            </Field>

            <Field label="Origem" htmlFor="inline-client-origin">
              <select
                id="inline-client-origin"
                value={newValues.origem}
                onChange={(event) =>
                  updateNew({ origem: event.target.value as ClientFormValues['origem'] })
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
          </div>

          <Field label="E-mail (opcional)" htmlFor="inline-client-email" error={newErrors.email}>
            <input
              id="inline-client-email"
              type="email"
              value={newValues.email}
              onChange={(event) => updateNew({ email: event.target.value })}
              placeholder="cliente@email.com"
              className={inputClass}
              aria-invalid={Boolean(newErrors.email)}
            />
          </Field>

          <Button type="button" size="sm" fullWidth onClick={handleCreate}>
            <Plus className="size-4" />
            Salvar e selecionar cliente
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

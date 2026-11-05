import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'

import type {
  ClausulaModelo,
  ModeloContrato,
  ModeloContratoDraft,
} from '@/domain/contracts'
import {
  createSampleContractContext,
  resolveContractClauses,
  unknownContractVariables,
} from '@/domain/contractTemplate'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, textareaClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { createId } from '@/shared/lib/id'
import { VariablePalette } from '@/features/contracts/components/VariablePalette'
import {
  createEmptyTemplateValues,
  templateToFormValues,
  validateTemplateForm,
  type TemplateFormErrors,
  type TemplateFormValues,
} from '@/features/contracts/lib/templateValidation'

interface TemplateFormProps {
  open: boolean
  modelo?: ModeloContrato
  onClose: () => void
  onSubmit: (draft: ModeloContratoDraft) => void
}

export function TemplateForm({ open, modelo, onClose, onSubmit }: TemplateFormProps) {
  const [values, setValues] = useState<TemplateFormValues>(() =>
    modelo ? templateToFormValues(modelo) : createEmptyTemplateValues(),
  )
  const [errors, setErrors] = useState<TemplateFormErrors>({})
  const [activeClauseId, setActiveClauseId] = useState<string | null>(
    values.clausulas[0]?.id ?? null,
  )

  const update = (patch: Partial<TemplateFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  const updateClause = (id: string, patch: Partial<ClausulaModelo>) => {
    setValues((current) => ({
      ...current,
      clausulas: current.clausulas.map((clausula) =>
        clausula.id === id ? { ...clausula, ...patch } : clausula,
      ),
    }))
    setErrors({})
  }

  const addClause = () => {
    const clause: ClausulaModelo = {
      id: createId('cl'),
      titulo: `${values.clausulas.length + 1}. Nova cláusula`,
      corpo: '',
    }
    setValues((current) => ({ ...current, clausulas: [...current.clausulas, clause] }))
    setActiveClauseId(clause.id)
    setErrors({})
  }

  const removeClause = (id: string) => {
    setValues((current) => ({
      ...current,
      clausulas: current.clausulas.filter((clausula) => clausula.id !== id),
    }))
    setErrors({})
  }

  const moveClause = (index: number, direction: -1 | 1) => {
    setValues((current) => {
      const target = index + direction
      if (target < 0 || target >= current.clausulas.length) return current

      const clausulas = [...current.clausulas]
      const [clause] = clausulas.splice(index, 1)
      if (!clause) return current
      clausulas.splice(target, 0, clause)
      return { ...current, clausulas }
    })
  }

  const insertVariable = (token: string) => {
    const clauseId = activeClauseId ?? values.clausulas[0]?.id
    if (!clauseId) return

    setValues((current) => ({
      ...current,
      clausulas: current.clausulas.map((clausula) =>
        clausula.id === clauseId
          ? {
              ...clausula,
              corpo: `${clausula.corpo}${clausula.corpo.endsWith(' ') || clausula.corpo.endsWith('\n') ? '' : ' '}{{${token}}}`,
            }
          : clausula,
      ),
    }))
    setErrors({})
  }

  const unknownVariables = useMemo(
    () =>
      [
        ...new Set(
          values.clausulas.flatMap((clausula) => unknownContractVariables(clausula.corpo)),
        ),
      ],
    [values.clausulas],
  )

  const sampleContext = useMemo(() => createSampleContractContext(), [])
  const previewClauses = useMemo(
    () => resolveContractClauses(values.clausulas, sampleContext),
    [sampleContext, values.clausulas],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateTemplateForm(values)

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
      title={modelo ? 'Editar modelo' : 'Novo modelo'}
      description="Use variáveis para preencher automaticamente os dados do cliente, pacote e ensaio."
      className="sm:w-[min(64rem,calc(100vw-2rem))]"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do modelo" htmlFor="template-name" error={errors.nome}>
            <input
              id="template-name"
              data-autofocus
              value={values.nome}
              onChange={(event) => update({ nome: event.target.value })}
              placeholder="Ex.: Contrato de Ensaio Gestante"
              className={inputClass}
              aria-invalid={Boolean(errors.nome)}
            />
          </Field>

          <Field label="Descrição" htmlFor="template-description">
            <input
              id="template-description"
              value={values.descricao}
              onChange={(event) => update({ descricao: event.target.value })}
              placeholder="Resumo do uso deste modelo"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Cláusulas
              </p>
              <Button type="button" size="sm" variant="secondary" onClick={addClause}>
                <Plus className="size-3.5" />
                Adicionar cláusula
              </Button>
            </div>

            {errors.clausulas ? (
              <p role="alert" className="text-xs font-medium text-red-600">
                {errors.clausulas}
              </p>
            ) : null}

            <div className="space-y-3">
              {values.clausulas.map((clausula, index) => (
                <div
                  key={clausula.id}
                  className="rounded-xl border border-line bg-surface p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      value={clausula.titulo}
                      onChange={(event) =>
                        updateClause(clausula.id, { titulo: event.target.value })
                      }
                      placeholder="Título da cláusula"
                      className={cn(inputClass, 'flex-1 font-medium')}
                      aria-label={`Título da cláusula ${index + 1}`}
                    />
                    <button
                      type="button"
                      aria-label="Mover cláusula para cima"
                      onClick={() => moveClause(index, -1)}
                      disabled={index === 0}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Mover cláusula para baixo"
                      onClick={() => moveClause(index, 1)}
                      disabled={index === values.clausulas.length - 1}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remover cláusula"
                      onClick={() => removeClause(clausula.id)}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <textarea
                    value={clausula.corpo}
                    onChange={(event) =>
                      updateClause(clausula.id, { corpo: event.target.value })
                    }
                    onFocus={() => setActiveClauseId(clausula.id)}
                    placeholder="Texto da cláusula. Use variáveis como {{cliente.nome}}."
                    rows={4}
                    className={cn(textareaClass, 'mt-2')}
                    aria-label={`Conteúdo da cláusula ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <p className="text-xs font-semibold text-ink">Variáveis disponíveis</p>
              <p className="mt-0.5 text-[10px] text-muted">
                Clique para inserir na cláusula em foco.
              </p>
              <div className="mt-3">
                <VariablePalette onInsert={insertVariable} />
              </div>
            </div>

            {unknownVariables.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                <p className="font-semibold">Variáveis não reconhecidas</p>
                <p className="mt-1 break-words">
                  {unknownVariables.map((token) => `{{${token}}}`).join(', ')}
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-line bg-surface p-3">
              <p className="text-xs font-semibold text-ink">Prévia com dados de exemplo</p>
              <div className="mt-2 max-h-72 space-y-3 overflow-y-auto">
                {previewClauses.map((clausula) => (
                  <div key={clausula.id}>
                    <p className="text-[11px] font-semibold text-ink">{clausula.titulo}</p>
                    <p className="mt-0.5 whitespace-pre-line text-[10px] leading-relaxed text-muted">
                      {clausula.corpo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
          <div>
            <p className="text-sm font-medium text-ink">Modelo ativo</p>
            <p className="text-[11px] text-muted">
              Modelos arquivados não aparecem em novos contratos.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.ativo}
            aria-label="Modelo ativo"
            onClick={() => update({ ativo: !values.ativo })}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              values.ativo ? 'bg-brand-600' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                values.ativo ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Check className="size-4" />
            {modelo ? 'Salvar modelo' : 'Criar modelo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

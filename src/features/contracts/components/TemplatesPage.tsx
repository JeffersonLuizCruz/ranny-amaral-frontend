import { useMemo, useState } from 'react'
import {
  Archive,
  Copy,
  FileSignature,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'

import type {
  ModeloContrato,
  ModeloContratoDraft,
} from '@/domain/contracts'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useTemplateStore } from '@/features/contracts/store/templateStore'
import { TemplateForm } from '@/features/contracts/components/TemplateForm'

export function TemplatesPage() {
  const modelos = useTemplateStore((state) => state.modelos)
  const createTemplate = useTemplateStore((state) => state.createTemplate)
  const updateTemplate = useTemplateStore((state) => state.updateTemplate)
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate)
  const duplicateTemplate = useTemplateStore((state) => state.duplicateTemplate)
  const toggleTemplateActive = useTemplateStore((state) => state.toggleTemplateActive)
  const contratos = useContractStore((state) => state.contratos)
  const addToast = useToastStore((state) => state.addToast)

  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ModeloContrato | null>(null)

  const usage = useMemo(() => {
    const map = new Map<string, number>()
    for (const contrato of contratos) {
      map.set(contrato.modeloId, (map.get(contrato.modeloId) ?? 0) + 1)
    }
    return map
  }, [contratos])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return modelos

    return modelos.filter(
      (modelo) =>
        modelo.nome.toLowerCase().includes(term) ||
        modelo.descricao.toLowerCase().includes(term),
    )
  }, [modelos, query])

  const handleSubmit = async (draft: ModeloContratoDraft) => {
    try {
      if (editing) {
        await updateTemplate(editing.id, draft)
        addToast('Modelo atualizado.')
      } else {
        await createTemplate(draft)
        addToast('Modelo criado.')
      }

      setCreating(false)
      setEditing(null)
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDelete = async (modelo: ModeloContrato) => {
    const linked = usage.get(modelo.id) ?? 0
    if (linked > 0) {
      addToast('Este modelo possui contratos vinculados. Arquive-o em vez de excluir.')
      return
    }

    const confirmed = window.confirm(`Excluir o modelo "${modelo.nome}"?`)
    if (!confirmed) return

    try {
      await deleteTemplate(modelo.id)
      addToast('Modelo excluído.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDuplicate = async (modelo: ModeloContrato) => {
    try {
      await duplicateTemplate(modelo.id)
      addToast('Modelo duplicado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleToggle = async (modelo: ModeloContrato) => {
    const estavaAtivo = modelo.ativo

    try {
      await toggleTemplateActive(modelo.id)
      addToast(estavaAtivo ? 'Modelo arquivado.' : 'Modelo reativado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const formOpen = creating || Boolean(editing)

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar modelo por nome ou descrição"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar modelo"
          />
        </div>

        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Novo modelo
        </Button>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title={modelos.length === 0 ? 'Nenhum modelo cadastrado' : 'Nenhum modelo encontrado'}
            description={
              modelos.length === 0
                ? 'Crie um modelo com cláusulas e variáveis para gerar contratos.'
                : 'Ajuste a busca ou crie um novo modelo.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Novo modelo
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((modelo) => {
              const linked = usage.get(modelo.id) ?? 0

              return (
                <article
                  key={modelo.id}
                  className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{modelo.nome}</h3>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                        {modelo.descricao || 'Sem descrição.'}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        modelo.ativo
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200',
                      )}
                    >
                      {modelo.ativo ? 'Ativo' : 'Arquivado'}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted">
                    <span className="rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                      v{modelo.versao}
                    </span>
                    <span className="rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                      {modelo.clausulas.length} cláusulas
                    </span>
                    <span className="rounded-full bg-canvas px-2 py-1 ring-1 ring-line">
                      {linked} {linked === 1 ? 'contrato' : 'contratos'}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(modelo)}>
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(modelo)}>
                      <Copy className="size-3.5" />
                      Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(modelo)}>
                      {modelo.ativo ? (
                        <>
                          <Archive className="size-3.5" />
                          Arquivar
                        </>
                      ) : (
                        <>
                          <RotateCcw className="size-3.5" />
                          Reativar
                        </>
                      )}
                    </Button>
                    {linked === 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(modelo)}
                      >
                        <Trash2 className="size-3.5" />
                        Excluir
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <TemplateForm
        key={creating ? 'new' : editing?.id ?? 'closed'}
        open={formOpen}
        modelo={editing ?? undefined}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

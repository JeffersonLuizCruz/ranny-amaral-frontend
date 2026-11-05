import { useMemo, useState } from 'react'
import { Package, Plus, Search } from 'lucide-react'

import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { useToastStore } from '@/shared/store/toastStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { PackageCard } from '@/features/packages/components/PackageCard'
import { PackageForm } from '@/features/packages/components/PackageForm'
import { usePackageStore } from '@/features/packages/store/packageStore'

export function PackagesPage() {
  const pacotes = usePackageStore((state) => state.pacotes)
  const createPackage = usePackageStore((state) => state.createPackage)
  const updatePackage = usePackageStore((state) => state.updatePackage)
  const deletePackage = usePackageStore((state) => state.deletePackage)
  const togglePackageActive = usePackageStore((state) => state.togglePackageActive)
  const appointments = useAppointmentStore((state) => state.appointments)
  const addToast = useToastStore((state) => state.addToast)

  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PacoteFotografico | null>(null)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const appointment of appointments) {
      map.set(appointment.pacoteId, (map.get(appointment.pacoteId) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return pacotes

    return pacotes.filter(
      (pacote) =>
        pacote.nome.toLowerCase().includes(term) ||
        pacote.descricao.toLowerCase().includes(term),
    )
  }, [pacotes, query])

  const handleSubmit = (draft: PacoteDraft) => {
    if (editing) {
      updatePackage(editing.id, draft)
      addToast('Pacote atualizado.')
    } else {
      createPackage(draft)
      addToast('Pacote criado.')
    }

    setCreating(false)
    setEditing(null)
  }

  const handleDelete = (pacote: PacoteFotografico) => {
    const linked = counts.get(pacote.id) ?? 0
    if (linked > 0) {
      addToast('Este pacote possui ensaios vinculados. Arquive-o em vez de excluir.')
      return
    }

    const confirmed = window.confirm(`Excluir o pacote "${pacote.nome}"?`)
    if (!confirmed) return

    deletePackage(pacote.id)
    addToast('Pacote excluído.')
  }

  const handleToggleActive = (pacote: PacoteFotografico) => {
    togglePackageActive(pacote.id)
    addToast(pacote.ativo ? 'Pacote arquivado.' : 'Pacote reativado.')
  }

  const formOpen = creating || Boolean(editing)
  const activeCount = pacotes.filter((pacote) => pacote.ativo).length

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Catálogo de pacotes</h2>
            <p className="mt-0.5 text-xs text-muted">
              {pacotes.length} {pacotes.length === 1 ? 'pacote' : 'pacotes'} · {activeCount}{' '}
              {activeCount === 1 ? 'ativo' : 'ativos'}
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Novo pacote
          </Button>
        </div>

        <div className="relative mt-4 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pacote por nome ou descrição"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar pacote"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={pacotes.length === 0 ? 'Nenhum pacote cadastrado' : 'Nenhum pacote encontrado'}
            description={
              pacotes.length === 0
                ? 'Crie o primeiro pacote para começar a agendar ensaios.'
                : 'Tente ajustar a busca ou cadastre um novo pacote.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Novo pacote
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((pacote) => (
              <PackageCard
                key={pacote.id}
                pacote={pacote}
                appointmentCount={counts.get(pacote.id) ?? 0}
                onEdit={() => setEditing(pacote)}
                onToggleActive={() => handleToggleActive(pacote)}
                onDelete={() => handleDelete(pacote)}
              />
            ))}
          </div>
        )}
      </div>

      <PackageForm
        key={creating ? 'new' : editing?.id ?? 'closed'}
        open={formOpen}
        pacote={editing ?? undefined}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

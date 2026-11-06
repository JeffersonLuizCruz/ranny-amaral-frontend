import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, Search } from 'lucide-react'

import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { Paginador } from '@/shared/components/ui/Paginador'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { PackageCard } from '@/features/packages/components/PackageCard'
import { PackageForm } from '@/features/packages/components/PackageForm'
import { usePackageStore } from '@/features/packages/store/packageStore'

export function PackagesPage() {
  const paginaPacotes = usePackageStore((state) => state.paginaPacotes)
  const createPackage = usePackageStore((state) => state.createPackage)
  const updatePackage = usePackageStore((state) => state.updatePackage)
  const deletePackage = usePackageStore((state) => state.deletePackage)
  const togglePackageActive = usePackageStore((state) => state.togglePackageActive)
  const carregandoPagina = usePackageStore((state) => state.carregandoPagina)
  const erro = usePackageStore((state) => state.erro)
  const carregarPaginaPacotes = usePackageStore((state) => state.carregarPaginaPacotes)
  const appointments = useAppointmentStore((state) => state.appointments)
  const addToast = useToastStore((state) => state.addToast)

  const [query, setQuery] = useState('')
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(12)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PacoteFotografico | null>(null)
  const queryDebounced = useDebouncedValue(query)

  useEffect(() => {
    void carregarPaginaPacotes({
      q: queryDebounced.trim() || undefined,
      pagina,
      tamanho,
    }).catch(() => undefined)
  }, [carregarPaginaPacotes, pagina, queryDebounced, tamanho])

  const pacotes = paginaPacotes?.itens ?? []

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const appointment of appointments) {
      map.set(appointment.pacoteId, (map.get(appointment.pacoteId) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const recarregarPagina = () =>
    carregarPaginaPacotes({
      q: queryDebounced.trim() || undefined,
      pagina,
      tamanho,
    })

  const handleSubmit = async (draft: PacoteDraft) => {
    try {
      if (editing) {
        await updatePackage(editing.id, draft)
        addToast('Pacote atualizado.')
      } else {
        await createPackage(draft)
        addToast('Pacote criado.')
      }

      await recarregarPagina()
      setCreating(false)
      setEditing(null)
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDelete = async (pacote: PacoteFotografico) => {
    const linked = counts.get(pacote.id) ?? 0
    if (linked > 0) {
      addToast('Este pacote possui ensaios vinculados. Arquive-o em vez de excluir.')
      return
    }

    const confirmed = window.confirm(`Excluir o pacote "${pacote.nome}"?`)
    if (!confirmed) return

    try {
      await deletePackage(pacote.id)
      await recarregarPagina()
      addToast('Pacote excluído.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleToggleActive = async (pacote: PacoteFotografico) => {
    const estavaAtivo = pacote.ativo

    try {
      await togglePackageActive(pacote.id)
      await recarregarPagina()
      addToast(estavaAtivo ? 'Pacote arquivado.' : 'Pacote reativado.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const formOpen = creating || Boolean(editing)
  const totalItens = paginaPacotes?.totalItens ?? 0

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Catálogo de pacotes</h2>
            <p className="mt-0.5 text-xs text-muted">
              {totalItens} {totalItens === 1 ? 'pacote' : 'pacotes'}
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
            onChange={(event) => {
              setQuery(event.target.value)
              setPagina(0)
            }}
            placeholder="Buscar pacote por nome ou descrição"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar pacote"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {erro ? (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{erro}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void recarregarPagina().catch(() => undefined)
              }}
            >
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {carregandoPagina && !paginaPacotes ? (
          <p className="py-10 text-center text-sm text-muted">Carregando pacotes…</p>
        ) : pacotes.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              query.trim()
                ? 'Nenhum pacote encontrado'
                : 'Nenhum pacote cadastrado'
            }
            description={
              query.trim()
                ? 'Tente ajustar a busca ou cadastre um novo pacote.'
                : 'Crie o primeiro pacote para começar a agendar ensaios.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Novo pacote
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pacotes.map((pacote) => (
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
            <Paginador
              pagina={paginaPacotes?.pagina ?? pagina}
              tamanho={paginaPacotes?.tamanho ?? tamanho}
              totalItens={paginaPacotes?.totalItens ?? 0}
              totalPaginas={paginaPacotes?.totalPaginas ?? 0}
              temAnterior={paginaPacotes?.temAnterior ?? false}
              temProxima={paginaPacotes?.temProxima ?? false}
              carregando={carregandoPagina}
              onPaginaChange={setPagina}
              onTamanhoChange={(novoTamanho) => {
                setTamanho(novoTamanho)
                setPagina(0)
              }}
            />
          </>
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

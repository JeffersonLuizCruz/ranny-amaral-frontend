import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { Cliente, ClienteDraft } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { Paginador } from '@/shared/components/ui/Paginador'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { ClientForm } from '@/features/clients/components/ClientForm'
import { ClientList } from '@/features/clients/components/ClientList'
import { useClientStore } from '@/features/clients/store/clientStore'

export function ClientsPage() {
  const paginaClientes = useClientStore((state) => state.paginaClientes)
  const createClient = useClientStore((state) => state.createClient)
  const updateClient = useClientStore((state) => state.updateClient)
  const deleteClient = useClientStore((state) => state.deleteClient)
  const carregandoPagina = useClientStore((state) => state.carregandoPagina)
  const erro = useClientStore((state) => state.erro)
  const carregarPaginaClientes = useClientStore((state) => state.carregarPaginaClientes)
  const appointments = useAppointmentStore((state) => state.appointments)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const addToast = useToastStore((state) => state.addToast)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(12)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const queryDebounced = useDebouncedValue(query)

  useEffect(() => {
    void carregarPaginaClientes({
      q: queryDebounced.trim() || undefined,
      pagina,
      tamanho,
    }).catch(() => undefined)
  }, [carregarPaginaClientes, pagina, queryDebounced, tamanho])

  const clientes = paginaClientes?.itens ?? []

  const appointmentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const appointment of appointments) {
      if (!appointment.clienteId) continue
      map.set(
        appointment.clienteId,
        (map.get(appointment.clienteId) ?? 0) + 1,
      )
    }
    return map
  }, [appointments])

  const lastAppointments = useMemo(() => {
    const map = new Map<string, string>()

    for (const appointment of appointments) {
      if (!appointment.clienteId) continue
      const current = map.get(appointment.clienteId)
      if (!current || new Date(appointment.dataHoraInicio) > new Date(current)) {
        map.set(appointment.clienteId, appointment.dataHoraInicio)
      }
    }

    const labels = new Map<string, string>()
    for (const [clienteId, iso] of map) {
      labels.set(clienteId, format(new Date(iso), "d 'de' MMM", { locale: ptBR }))
    }
    return labels
  }, [appointments])

  const recarregarPagina = () =>
    carregarPaginaClientes({
      q: queryDebounced.trim() || undefined,
      pagina,
      tamanho,
    })

  const handleSubmit = async (draft: ClienteDraft) => {
    try {
      if (editing) {
        await updateClient(editing.id, draft)
        addToast('Cliente atualizado.')
      } else {
        await createClient(draft)
        addToast('Cliente cadastrado.')
      }

      await recarregarPagina()
      setCreating(false)
      setEditing(null)
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleDelete = async (cliente: Cliente) => {
    const linked = appointmentCounts.get(cliente.id) ?? 0
    if (linked > 0) {
      addToast('Este cliente possui ensaios vinculados. Exclua ou remaneje os ensaios primeiro.')
      return
    }

    const confirmed = window.confirm(`Excluir o cliente "${cliente.nome}"?`)
    if (!confirmed) return

    try {
      await deleteClient(cliente.id)
      await recarregarPagina()
      addToast('Cliente excluído.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleCreateAppointment = (cliente: Cliente) => {
    openCreateDrawer(undefined, '09:00', cliente.id)
    navigate('/agenda')
  }

  const formOpen = creating || Boolean(editing)

  return (
    <div className="thin-scrollbar h-full overflow-y-auto bg-canvas">
      <div className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Base de clientes</h2>
            <p className="mt-0.5 text-xs text-muted">
              {paginaClientes?.totalItens ?? 0}{' '}
              {(paginaClientes?.totalItens ?? 0) === 1
                ? 'cliente cadastrado'
                : 'clientes cadastrados'}
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Novo cliente
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
            placeholder="Buscar por nome, WhatsApp ou e-mail"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar cliente"
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

        {carregandoPagina && !paginaClientes ? (
          <p className="py-10 text-center text-sm text-muted">Carregando clientes…</p>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              query.trim()
                ? 'Nenhum cliente encontrado'
                : 'Nenhum cliente cadastrado'
            }
            description={
              query.trim()
                ? 'Tente ajustar a busca ou cadastre um novo cliente.'
                : 'Cadastre o primeiro cliente ou crie um cliente diretamente ao agendar um ensaio.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Novo cliente
              </Button>
            }
          />
        ) : (
          <>
            <ClientList
              clientes={clientes}
              appointmentCounts={appointmentCounts}
              lastAppointments={lastAppointments}
              onEdit={setEditing}
              onDelete={handleDelete}
              onCreateAppointment={handleCreateAppointment}
            />
            <Paginador
              pagina={paginaClientes?.pagina ?? pagina}
              tamanho={paginaClientes?.tamanho ?? tamanho}
              totalItens={paginaClientes?.totalItens ?? 0}
              totalPaginas={paginaClientes?.totalPaginas ?? 0}
              temAnterior={paginaClientes?.temAnterior ?? false}
              temProxima={paginaClientes?.temProxima ?? false}
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

      <ClientForm
        key={creating ? 'new' : editing?.id ?? 'closed'}
        open={formOpen}
        cliente={editing ?? undefined}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

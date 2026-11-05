import { useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { Cliente, ClienteDraft } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToastStore } from '@/shared/store/toastStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { ClientForm } from '@/features/clients/components/ClientForm'
import { ClientList } from '@/features/clients/components/ClientList'
import { useClientStore } from '@/features/clients/store/clientStore'

export function ClientsPage() {
  const clientes = useClientStore((state) => state.clientes)
  const createClient = useClientStore((state) => state.createClient)
  const updateClient = useClientStore((state) => state.updateClient)
  const deleteClient = useClientStore((state) => state.deleteClient)
  const appointments = useAppointmentStore((state) => state.appointments)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const addToast = useToastStore((state) => state.addToast)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return clientes

    const digits = term.replace(/\D/g, '')

    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(term) ||
        (digits.length > 0 && cliente.whatsapp.replace(/\D/g, '').includes(digits)) ||
        (cliente.email?.toLowerCase().includes(term) ?? false),
    )
  }, [clientes, query])

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

  const handleSubmit = (draft: ClienteDraft) => {
    if (editing) {
      updateClient(editing.id, draft)
      addToast('Cliente atualizado.')
    } else {
      createClient(draft)
      addToast('Cliente cadastrado.')
    }

    setCreating(false)
    setEditing(null)
  }

  const handleDelete = (cliente: Cliente) => {
    const linked = appointmentCounts.get(cliente.id) ?? 0
    if (linked > 0) {
      addToast('Este cliente possui ensaios vinculados. Exclua ou remaneje os ensaios primeiro.')
      return
    }

    const confirmed = window.confirm(`Excluir o cliente "${cliente.nome}"?`)
    if (!confirmed) return

    deleteClient(cliente.id)
    addToast('Cliente excluído.')
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
              {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, WhatsApp ou e-mail"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar cliente"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
            description={
              clientes.length === 0
                ? 'Cadastre o primeiro cliente ou crie um cliente diretamente ao agendar um ensaio.'
                : 'Tente ajustar a busca ou cadastre um novo cliente.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Novo cliente
              </Button>
            }
          />
        ) : (
          <ClientList
            clientes={filtered}
            appointmentCounts={appointmentCounts}
            lastAppointments={lastAppointments}
            onEdit={setEditing}
            onDelete={handleDelete}
            onCreateAppointment={handleCreateAppointment}
          />
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

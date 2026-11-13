import type { Cliente, PacoteFotografico } from '@/domain/types'
import { ClientCard } from '@/features/clients/components/ClientCard'
import type { ResumoCliente } from '@/features/clients/lib/profile'

interface ClientListProps {
  clientes: Cliente[]
  resumos: Map<string, ResumoCliente>
  pacotesById: Map<string, PacoteFotografico>
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onCreateAppointment: (cliente: Cliente) => void
}

export function ClientList({
  clientes,
  resumos,
  pacotesById,
  onEdit,
  onDelete,
  onCreateAppointment,
}: ClientListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {clientes.map((cliente) => {
        const resumo = resumos.get(cliente.id)
        if (!resumo) return null

        return (
          <ClientCard
            key={cliente.id}
            cliente={cliente}
            resumo={resumo}
            pacotesById={pacotesById}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateAppointment={onCreateAppointment}
          />
        )
      })}
    </div>
  )
}

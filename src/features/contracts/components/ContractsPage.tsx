import { useMemo, useState } from 'react'
import { CalendarPlus, FileSignature, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  ACEITE_STATUS_META,
  ACEITE_STATUS_ORDER,
  type ContratoAceiteStatus,
  type ContratoPagamentoStatus,
} from '@/domain/contracts'
import { PAGAMENTO_STATUS_META } from '@/domain/payments'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { ContractCard } from '@/features/contracts/components/ContractCard'

type AceiteFilter = ContratoAceiteStatus | 'todos'
type PagamentoFilter = ContratoPagamentoStatus | 'todos'

const PAGAMENTO_ORDER: ContratoPagamentoStatus[] = [
  'pendente',
  'confirmado',
  'isento',
  'cancelado',
]

export function ContractsPage() {
  const contratos = useContractStore((state) => state.contratos)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [aceite, setAceite] = useState<AceiteFilter>('todos')
  const [pagamento, setPagamento] = useState<PagamentoFilter>('todos')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()

    return contratos.filter((contrato) => {
      if (aceite !== 'todos' && contrato.statusAceite !== aceite) return false
      if (pagamento !== 'todos' && contrato.statusPagamento !== pagamento) return false
      if (!term) return true

      return (
        contrato.numero.toLowerCase().includes(term) ||
        contrato.snapshot.cliente.nome.toLowerCase().includes(term) ||
        (contrato.snapshot.pacote?.nome.toLowerCase().includes(term) ?? false)
      )
    })
  }, [aceite, contratos, pagamento, query])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por número, cliente ou pacote"
            className={cn(inputClass, 'pl-10')}
            aria-label="Buscar contrato"
          />
        </div>

        <Button
          onClick={() => {
            openCreateDrawer()
            navigate('/agenda')
          }}
        >
          <CalendarPlus className="size-4" />
          Novo ensaio
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Aceite
          </span>
          <FilterChip
            active={aceite === 'todos'}
            label={`Todos (${contratos.length})`}
            onClick={() => setAceite('todos')}
          />
          {ACEITE_STATUS_ORDER.map((item) => {
            const count = contratos.filter(
              (contrato) => contrato.statusAceite === item,
            ).length
            return (
              <FilterChip
                key={item}
                active={aceite === item}
                label={`${ACEITE_STATUS_META[item].label} (${count})`}
                dot={ACEITE_STATUS_META[item].dot}
                onClick={() => setAceite(item)}
              />
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Pagamento
          </span>
          <FilterChip
            active={pagamento === 'todos'}
            label="Todos"
            onClick={() => setPagamento('todos')}
          />
          {PAGAMENTO_ORDER.map((item) => {
            const count = contratos.filter(
              (contrato) => contrato.statusPagamento === item,
            ).length
            return (
              <FilterChip
                key={item}
                active={pagamento === item}
                label={`${PAGAMENTO_STATUS_META[item].label} (${count})`}
                dot={PAGAMENTO_STATUS_META[item].dot}
                onClick={() => setPagamento(item)}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title={
              contratos.length === 0
                ? 'Nenhum contrato criado'
                : 'Nenhum contrato encontrado'
            }
            description={
              contratos.length === 0
                ? 'Crie um ensaio para gerar o contrato automaticamente.'
                : 'Ajuste a busca ou os filtros de aceite e pagamento.'
            }
            action={
              <Button
                onClick={() => {
                  openCreateDrawer()
                  navigate('/agenda')
                }}
              >
                <CalendarPlus className="size-4" />
                Novo ensaio
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((contrato) => (
              <ContractCard key={contrato.id} contrato={contrato} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  label,
  dot,
  onClick,
}: {
  active: boolean
  label: string
  dot?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition',
        active
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-surface text-muted ring-line hover:text-ink',
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full', dot)} /> : null}
      {label}
    </button>
  )
}

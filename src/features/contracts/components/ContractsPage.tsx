import { useEffect, useMemo, useState } from 'react'
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
import { Paginador } from '@/shared/components/ui/Paginador'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
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
  const paginaContratos = useContractStore((state) => state.paginaContratos)
  const carregandoPagina = useContractStore((state) => state.carregandoPagina)
  const erro = useContractStore((state) => state.erro)
  const carregarPaginaContratos = useContractStore((state) => state.carregarPaginaContratos)
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [aceite, setAceite] = useState<AceiteFilter>('todos')
  const [pagamento, setPagamento] = useState<PagamentoFilter>('todos')
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(12)
  const queryDebounced = useDebouncedValue(query)

  useEffect(() => {
    void carregarPaginaContratos({
      q: queryDebounced.trim() || undefined,
      statusAceite: aceite === 'todos' ? undefined : aceite,
      statusPagamento: pagamento === 'todos' ? undefined : pagamento,
      pagina,
      tamanho,
    }).catch(() => undefined)
  }, [aceite, carregarPaginaContratos, pagina, pagamento, queryDebounced, tamanho])

  const items = paginaContratos?.itens ?? []

  const recarregarPagina = () =>
    carregarPaginaContratos({
      q: queryDebounced.trim() || undefined,
      statusAceite: aceite === 'todos' ? undefined : aceite,
      statusPagamento: pagamento === 'todos' ? undefined : pagamento,
      pagina,
      tamanho,
    })

  const filtrosAtivos = useMemo(
    () => aceite !== 'todos' || pagamento !== 'todos' || query.trim().length > 0,
    [aceite, pagamento, query],
  )

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPagina(0)
            }}
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
            onClick={() => {
              setAceite('todos')
              setPagina(0)
            }}
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
                onClick={() => {
                  setAceite(item)
                  setPagina(0)
                }}
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
            onClick={() => {
              setPagamento('todos')
              setPagina(0)
            }}
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
                onClick={() => {
                  setPagamento(item)
                  setPagina(0)
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-4">
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

        {carregandoPagina && !paginaContratos ? (
          <p className="py-10 text-center text-sm text-muted">Carregando contratos…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title={
              filtrosAtivos
                ? 'Nenhum contrato encontrado'
                : 'Nenhum contrato criado'
            }
            description={
              filtrosAtivos
                ? 'Ajuste a busca ou os filtros de aceite e pagamento.'
                : 'Crie um ensaio para gerar o contrato automaticamente.'
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
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((contrato) => (
                <ContractCard key={contrato.id} contrato={contrato} />
              ))}
            </div>
            <Paginador
              pagina={paginaContratos?.pagina ?? pagina}
              tamanho={paginaContratos?.tamanho ?? tamanho}
              totalItens={paginaContratos?.totalItens ?? 0}
              totalPaginas={paginaContratos?.totalPaginas ?? 0}
              temAnterior={paginaContratos?.temAnterior ?? false}
              temProxima={paginaContratos?.temProxima ?? false}
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

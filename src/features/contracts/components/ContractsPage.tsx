import { useEffect, useMemo, useState } from 'react'
import {
  CalendarPlus,
  FileCheck2,
  FileSignature,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  ACEITE_STATUS_META,
  ACEITE_STATUS_ORDER,
  type ContratoAceiteStatus,
  type ContratoPagamentoStatus,
} from '@/domain/contracts'
import {
  contarSituacoesContrato,
  SITUACAO_CONTRATO_META,
  SITUACOES_CONTRATO,
  type ContratoSituacao,
} from '@/domain/contractQueues'
import { ENTRADA_STATUS_META, SALDO_FINAL_STATUS_META } from '@/domain/payments'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { inputClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { Paginador } from '@/shared/components/ui/Paginador'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  useContractStore,
  type FiltrosContratosPagina,
} from '@/features/contracts/store/contractStore'
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
  const carregarPaginaContratos = useContractStore(
    (state) => state.carregarPaginaContratos,
  )
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [situacao, setSituacao] = useState<ContratoSituacao>('todos')
  const [aceite, setAceite] = useState<AceiteFilter>('todos')
  const [entrada, setEntrada] = useState<PagamentoFilter>('todos')
  const [saldoFinal, setSaldoFinal] = useState<PagamentoFilter>('todos')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(12)
  const queryDebounced = useDebouncedValue(query)

  const contagens = useMemo(
    () => contarSituacoesContrato(contratos),
    [contratos],
  )

  const filtrosStatus = useMemo<FiltrosContratosPagina>(() => {
    const busca = isAdmin ? queryDebounced.trim() || undefined : undefined

    if (situacao !== 'todos') {
      return busca ? { q: busca, situacao } : { situacao }
    }

    if (!isAdmin) {
      return {}
    }

    return {
      q: busca,
      statusAceite: aceite === 'todos' ? undefined : aceite,
      statusEntrada: entrada === 'todos' ? undefined : entrada,
      statusSaldoFinal: saldoFinal === 'todos' ? undefined : saldoFinal,
    }
  }, [aceite, entrada, isAdmin, queryDebounced, saldoFinal, situacao])

  useEffect(() => {
    void carregarPaginaContratos({ ...filtrosStatus, pagina, tamanho }).catch(
      () => undefined,
    )
  }, [carregarPaginaContratos, filtrosStatus, pagina, tamanho])

  const items = paginaContratos?.itens ?? []

  const recarregarPagina = () =>
    carregarPaginaContratos({ ...filtrosStatus, pagina, tamanho })

  const filtrosAvancadosAtivos =
    aceite !== 'todos' || entrada !== 'todos' || saldoFinal !== 'todos'

  const filtrosAtivos = useMemo(() => {
    if (situacao !== 'todos') return true
    if (!isAdmin) return false
    return filtrosAvancadosAtivos || query.trim().length > 0
  }, [filtrosAvancadosAtivos, isAdmin, query, situacao])

  const limparFiltrosAvancados = () => {
    setAceite('todos')
    setEntrada('todos')
    setSaldoFinal('todos')
  }

  const selecionarSituacao = (valor: ContratoSituacao) => {
    setSituacao(valor)
    if (valor !== 'todos') limparFiltrosAvancados()
    setPagina(0)
  }

  const selecionarAceite = (valor: AceiteFilter) => {
    setSituacao('todos')
    setAceite(valor)
    setPagina(0)
  }

  const selecionarEntrada = (valor: PagamentoFilter) => {
    setSituacao('todos')
    setEntrada(valor)
    setPagina(0)
  }

  const selecionarSaldoFinal = (valor: PagamentoFilter) => {
    setSituacao('todos')
    setSaldoFinal(valor)
    setPagina(0)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isAdmin ? (
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
        ) : null}

        <div className={cn('flex items-center gap-2', !isAdmin && 'sm:ml-auto')}>
          {isAdmin ? (
            <Button
              variant="secondary"
              onClick={() => setFiltrosAbertos(true)}
              aria-label="Abrir filtros avançados"
            >
              <SlidersHorizontal className="size-4" />
              Filtros
              {filtrosAvancadosAtivos ? (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                  {
                    [aceite, entrada, saldoFinal].filter(
                      (valor) => valor !== 'todos',
                    ).length
                  }
                </span>
              ) : null}
            </Button>
          ) : null}

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
      </div>

      <div className="sticky top-0 z-20 -mx-4 mt-3 border-b border-line/60 bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        {contagens.comprovante_em_analise > 0 &&
        situacao !== 'comprovante_em_analise' ? (
          <button
            type="button"
            onClick={() => selecionarSituacao('comprovante_em_analise')}
            className="mb-2 flex w-full items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-medium text-blue-800 transition hover:bg-blue-100"
          >
            <FileCheck2 className="size-4 shrink-0" />
            <span className="flex-1">
              {contagens.comprovante_em_analise === 1
                ? '1 comprovante esperando aprovação'
                : `${contagens.comprovante_em_analise} comprovantes esperando aprovação`}
            </span>
            <span className="shrink-0 text-[11px] font-semibold">Ver fila</span>
          </button>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          {SITUACOES_CONTRATO.map((valor) => (
            <FilterChip
              key={valor}
              active={situacao === valor}
              label={`${SITUACAO_CONTRATO_META[valor].label} (${contagens[valor]})`}
              onClick={() => selecionarSituacao(valor)}
            />
          ))}
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
          <p className="py-10 text-center text-sm text-muted">
            Carregando contratos…
          </p>
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
                ? 'Ajuste a busca ou a fila selecionada.'
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

      {isAdmin && filtrosAbertos ? (
        <Modal
          open
          onClose={() => setFiltrosAbertos(false)}
          title="Filtros avançados"
          description="Combine status de aceite, entrada e saldo final."
        >
          <div className="space-y-4">
            <FilterGroup
              title="Aceite"
              total={contratos.length}
              selected={aceite}
              onSelect={(valor) => selecionarAceite(valor as AceiteFilter)}
              options={ACEITE_STATUS_ORDER.map((item) => ({
                value: item,
                label: ACEITE_STATUS_META[item].label,
                count: contratos.filter(
                  (contrato) => contrato.statusAceite === item,
                ).length,
                dot: ACEITE_STATUS_META[item].dot,
              }))}
            />

            <FilterGroup
              title="Entrada"
              total={contratos.length}
              selected={entrada}
              onSelect={(valor) => selecionarEntrada(valor as PagamentoFilter)}
              options={PAGAMENTO_ORDER.map((item) => ({
                value: item,
                label: ENTRADA_STATUS_META[item].label,
                count: contratos.filter(
                  (contrato) => contrato.statusEntrada === item,
                ).length,
                dot: ENTRADA_STATUS_META[item].dot,
              }))}
            />

            <FilterGroup
              title="Saldo final"
              total={contratos.length}
              selected={saldoFinal}
              onSelect={(valor) => selecionarSaldoFinal(valor as PagamentoFilter)}
              options={PAGAMENTO_ORDER.map((item) => ({
                value: item,
                label: SALDO_FINAL_STATUS_META[item].label,
                count: contratos.filter(
                  (contrato) => contrato.statusSaldoFinal === item,
                ).length,
                dot: SALDO_FINAL_STATUS_META[item].dot,
              }))}
            />

            <Button
              variant="secondary"
              fullWidth
              onClick={limparFiltrosAvancados}
            >
              Limpar filtros
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

interface FilterOption {
  value: string
  label: string
  count: number
  dot?: string
}

function FilterGroup({
  title,
  total,
  selected,
  options,
  onSelect,
}: {
  title: string
  total: number
  selected: string
  options: FilterOption[]
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          active={selected === 'todos'}
          label={`Todos (${total})`}
          onClick={() => onSelect('todos')}
        />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            active={selected === option.value}
            label={`${option.label} (${option.count})`}
            dot={option.dot}
            onClick={() => onSelect(option.value)}
          />
        ))}
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
      aria-pressed={active}
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

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface PaginadorProps {
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
  temAnterior: boolean
  temProxima: boolean
  carregando?: boolean
  tamanhos?: number[]
  onPaginaChange: (pagina: number) => void
  onTamanhoChange: (tamanho: number) => void
}

const TAMANHOS_PADRAO = [12, 24, 48]

/**
 * Controle reutilizável de paginação.
 *
 * Não conhece a origem dos dados: recebe apenas o envelope `Pagina<T>` e
 * devolve as intenções de navegação. Assim pode ser usado por clientes,
 * pacotes, contratos e futuras listagens.
 */
export function Paginador({
  pagina,
  tamanho,
  totalItens,
  totalPaginas,
  temAnterior,
  temProxima,
  carregando = false,
  tamanhos = TAMANHOS_PADRAO,
  onPaginaChange,
  onTamanhoChange,
}: PaginadorProps) {
  if (totalItens === 0) return null

  const primeiro = pagina * tamanho + 1
  const ultimo = Math.min((pagina + 1) * tamanho, totalItens)

  return (
    <nav
      aria-label="Paginação"
      className="mt-6 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-muted">
        Exibindo <span className="font-medium text-ink">{primeiro}</span>–
        <span className="font-medium text-ink">{ultimo}</span> de{' '}
        <span className="font-medium text-ink">{totalItens}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Por página
          <select
            value={tamanho}
            onChange={(event) => onTamanhoChange(Number(event.target.value))}
            className={cn(
              'h-8 rounded-lg border border-line bg-surface px-2 text-xs text-ink',
              'outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            )}
            aria-label="Itens por página"
          >
            {tamanhos.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </label>

        <Button
          size="sm"
          variant="secondary"
          disabled={!temAnterior || carregando}
          onClick={() => onPaginaChange(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>

        <span className="min-w-24 text-center text-xs text-muted">
          Página <span className="font-medium text-ink">{pagina + 1}</span> de{' '}
          <span className="font-medium text-ink">{Math.max(totalPaginas, 1)}</span>
        </span>

        <Button
          size="sm"
          variant="secondary"
          disabled={!temProxima || carregando}
          onClick={() => onPaginaChange(pagina + 1)}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}

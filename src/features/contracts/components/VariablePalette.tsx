import { Code2 } from 'lucide-react'

import { CONTRACT_VARIABLES } from '@/domain/contractTemplate'

interface VariablePaletteProps {
  onInsert: (token: string) => void
}

export function VariablePalette({ onInsert }: VariablePaletteProps) {
  const groups = ['Estúdio', 'Cliente', 'Pacote', 'Agendamento', 'Contrato'] as const

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const variables = CONTRACT_VARIABLES.filter((variable) => variable.group === group)
        if (variables.length === 0) return null

        return (
          <div key={group}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {group}
            </p>
            <div className="flex flex-wrap gap-1">
              {variables.map((variable) => (
                <button
                  key={variable.token}
                  type="button"
                  title={`Inserir {{${variable.token}}}`}
                  onClick={() => onInsert(variable.token)}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[10px] font-medium text-muted ring-1 ring-line transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                >
                  <Code2 className="size-3" />
                  {variable.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

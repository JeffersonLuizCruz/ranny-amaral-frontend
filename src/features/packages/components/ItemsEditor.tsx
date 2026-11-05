import { useState } from 'react'
import { Plus, X } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'
import { inputClass } from '@/shared/components/ui/Field'

interface ItemsEditorProps {
  items: string[]
  onChange: (items: string[]) => void
}

export function ItemsEditor({ items, onChange }: ItemsEditorProps) {
  const [draft, setDraft] = useState('')

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    onChange([...items, value])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5"
            >
              <span className="min-w-0 flex-1 text-xs text-ink">{item}</span>
              <button
                type="button"
                aria-label={`Remover ${item}`}
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-red-600"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted">Nenhum item adicionado ainda.</p>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem()
            }
          }}
          placeholder="Ex.: 20 fotos tratadas"
          className={inputClass}
          aria-label="Novo item incluso"
        />
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
    </div>
  )
}

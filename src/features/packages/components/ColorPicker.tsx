import { Palette } from 'lucide-react'

import { PACKAGE_COLORS } from '@/domain/constants'
import { cn } from '@/shared/lib/cn'
import { isHexColor, normalizeHex } from '@/shared/lib/colors'
import { inputClass } from '@/shared/components/ui/Field'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const safeValue = isHexColor(value) ? normalizeHex(value) : '#7C3AED'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {PACKAGE_COLORS.map((color) => {
          const selected = normalizeHex(color) === normalizeHex(value)

          return (
            <button
              key={color}
              type="button"
              aria-label={`Usar cor ${color}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={cn(
                'size-8 rounded-full border-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                selected ? 'border-ink' : 'border-white ring-1 ring-line',
              )}
              style={{ backgroundColor: color }}
            />
          )
        })}

        <label
          className="grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-line bg-surface text-muted transition hover:border-slate-400 hover:text-ink"
          title="Cor personalizada"
        >
          <Palette className="size-3.5" />
          <input
            type="color"
            value={safeValue}
            onChange={(event) => onChange(event.target.value)}
            className="sr-only"
            aria-label="Escolher cor personalizada"
          />
        </label>
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#7C3AED"
        className={inputClass}
        aria-label="Código hexadecimal da cor"
      />
    </div>
  )
}

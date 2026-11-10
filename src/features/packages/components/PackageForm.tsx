import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Images, Sparkles, Video } from 'lucide-react'

import type { PacoteDraft, PacoteFotografico } from '@/domain/types'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, textareaClass } from '@/shared/components/ui/Field'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { formatBRL, parseCurrencyInput } from '@/shared/lib/currency'
import {
  createEmptyPackageValues,
  packageToFormValues,
  validatePackageForm,
  type PackageFormErrors,
  type PackageFormValues,
} from '@/features/packages/lib/validation'
import { ColorPicker } from '@/features/packages/components/ColorPicker'
import { ItemsEditor } from '@/features/packages/components/ItemsEditor'

interface PackageFormProps {
  open: boolean
  pacote?: PacoteFotografico
  onClose: () => void
  onSubmit: (draft: PacoteDraft) => void
}

export function PackageForm({ open, pacote, onClose, onSubmit }: PackageFormProps) {
  const [values, setValues] = useState<PackageFormValues>(() =>
    pacote ? packageToFormValues(pacote) : createEmptyPackageValues(),
  )
  const [errors, setErrors] = useState<PackageFormErrors>({})

  const update = (patch: Partial<PackageFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as Array<keyof PackageFormValues>) {
        if (key === 'promocaoAtiva') continue
        if (key in next) delete next[key as keyof PackageFormErrors]
      }
      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validatePackageForm(values)

    if (!result.draft) {
      setErrors(result.errors)
      return
    }

    onSubmit(result.draft)
  }

  const valorTabela = parseCurrencyInput(values.valor)
  const valorPromocional = parseCurrencyInput(values.promocaoValor)
  const desconto =
    values.promocaoAtiva && valorPromocional > 0 && valorPromocional < valorTabela
      ? valorTabela - valorPromocional
      : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pacote ? 'Editar pacote' : 'Novo pacote'}
      description="Defina duração, valor, mídias inclusas e a regra de foto extra."
      className="w-[min(44rem,calc(100vw-2rem))]"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nome do pacote" htmlFor="package-name" error={errors.nome}>
          <input
            id="package-name"
            data-autofocus
            value={values.nome}
            onChange={(event) => update({ nome: event.target.value })}
            placeholder="Ex.: Ensaio Gestante Standard"
            className={inputClass}
            aria-invalid={Boolean(errors.nome)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Duração (min)"
            htmlFor="package-duration"
            error={errors.duracaoMinutos}
          >
            <input
              id="package-duration"
              type="number"
              min={15}
              step={15}
              value={values.duracaoMinutos}
              onChange={(event) => update({ duracaoMinutos: event.target.value })}
              className={inputClass}
              aria-invalid={Boolean(errors.duracaoMinutos)}
            />
          </Field>

          <Field label="Valor de tabela (R$)" htmlFor="package-value" error={errors.valor}>
            <input
              id="package-value"
              type="number"
              min={0}
              step={0.01}
              value={values.valor}
              onChange={(event) => update({ valor: event.target.value })}
              placeholder="890,00"
              className={inputClass}
              aria-invalid={Boolean(errors.valor)}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas/60 p-3">
          <div className="flex items-center gap-2">
            <Images className="size-4 text-muted" />
            <p className="text-xs font-semibold text-ink">Mídias inclusas</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field
              label="Fotos inclusas"
              htmlFor="package-included-photos"
              error={errors.quantidadeFotosInclusas}
            >
              <input
                id="package-included-photos"
                type="number"
                min={0}
                step={1}
                value={values.quantidadeFotosInclusas}
                onChange={(event) =>
                  update({ quantidadeFotosInclusas: event.target.value })
                }
                className={inputClass}
                aria-invalid={Boolean(errors.quantidadeFotosInclusas)}
              />
            </Field>

            <Field
              label="Vídeos inclusos"
              htmlFor="package-included-videos"
              error={errors.quantidadeVideosInclusos}
            >
              <div className="relative">
                <Video className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="package-included-videos"
                  type="number"
                  min={0}
                  step={1}
                  value={values.quantidadeVideosInclusos}
                  onChange={(event) =>
                    update({ quantidadeVideosInclusos: event.target.value })
                  }
                  className={cn(inputClass, 'pl-10')}
                  aria-invalid={Boolean(errors.quantidadeVideosInclusos)}
                />
              </div>
            </Field>
          </div>

          <Field
            label="Valor da foto extra (R$)"
            htmlFor="package-extra-photo"
            error={errors.valorFotoExtra}
            hint="Cobrado por cada foto escolhida acima da quantidade inclusa."
            className="mt-3"
          >
            <input
              id="package-extra-photo"
              type="number"
              min={0}
              step={0.01}
              value={values.valorFotoExtra}
              onChange={(event) => update({ valorFotoExtra: event.target.value })}
              placeholder="Ex.: 45,00"
              className={inputClass}
              aria-invalid={Boolean(errors.valorFotoExtra)}
            />
          </Field>

          <div className="mt-3 rounded-lg border border-line bg-canvas/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink">Faixas progressivas (opcional)</p>
                <p className="text-[11px] text-muted">
                  Ex.: a partir da 11ª foto extra, R$ 10,00 cada. O valor base acima vale
                  até a faixa seguinte.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({
                  faixasFotoExtra: [
                    ...values.faixasFotoExtra,
                    { quantidadeMinima: '', valorUnitario: '' },
                  ],
                })}
              >
                Adicionar
              </Button>
            </div>

            {values.faixasFotoExtra.length > 0 ? (
              <div className="mt-3 space-y-2">
                {values.faixasFotoExtra.map((faixa, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                    <Field label="A partir da foto extra" htmlFor={`package-tier-min-${index}`}>
                      <input
                        id={`package-tier-min-${index}`}
                        type="number"
                        min={2}
                        step={1}
                        value={faixa.quantidadeMinima}
                        onChange={(event) => {
                          const faixas = values.faixasFotoExtra.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, quantidadeMinima: event.target.value }
                              : item,
                          )
                          update({ faixasFotoExtra: faixas })
                        }}
                        placeholder="11"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Valor unitário (R$)" htmlFor={`package-tier-value-${index}`}>
                      <input
                        id={`package-tier-value-${index}`}
                        type="number"
                        min={0}
                        step={0.01}
                        value={faixa.valorUnitario}
                        onChange={(event) => {
                          const faixas = values.faixasFotoExtra.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, valorUnitario: event.target.value }
                              : item,
                          )
                          update({ faixasFotoExtra: faixas })
                        }}
                        placeholder="10,00"
                        className={inputClass}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => update({
                        faixasFotoExtra: values.faixasFotoExtra.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {errors.faixasFotoExtra ? (
              <p className="mt-2 text-[11px] font-medium text-red-600">
                {errors.faixasFotoExtra}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-600" />
              <div>
                <p className="text-xs font-semibold text-ink">Promoção</p>
                <p className="text-[11px] text-muted">
                  Aplicada por padrão na venda, mas pode ser removida no ensaio.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.promocaoAtiva}
              aria-label="Promoção ativa"
              onClick={() => update({ promocaoAtiva: !values.promocaoAtiva })}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                values.promocaoAtiva ? 'bg-brand-600' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                  values.promocaoAtiva ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          {values.promocaoAtiva ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Valor promocional (R$)"
                  htmlFor="package-promo-value"
                  error={errors.promocaoValor}
                >
                  <input
                    id="package-promo-value"
                    type="number"
                    min={0}
                    step={0.01}
                    value={values.promocaoValor}
                    onChange={(event) => update({ promocaoValor: event.target.value })}
                    placeholder="Ex.: 690,00"
                    className={inputClass}
                    aria-invalid={Boolean(errors.promocaoValor)}
                  />
                </Field>
                <Field label="Válida até" htmlFor="package-promo-until">
                  <input
                    id="package-promo-until"
                    type="date"
                    value={values.promocaoValidaAte}
                    onChange={(event) =>
                      update({ promocaoValidaAte: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Rótulo da promoção" htmlFor="package-promo-label">
                <input
                  id="package-promo-label"
                  value={values.promocaoRotulo}
                  onChange={(event) => update({ promocaoRotulo: event.target.value })}
                  placeholder="Ex.: Condição especial de lançamento"
                  className={inputClass}
                />
              </Field>

              {desconto > 0 ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  De {formatBRL(valorTabela)} por {formatBRL(valorPromocional)} · economia
                  de {formatBRL(desconto)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <Field label="Descrição" htmlFor="package-description">
          <textarea
            id="package-description"
            value={values.descricao}
            onChange={(event) => update({ descricao: event.target.value })}
            placeholder="Como funciona o ensaio, diferenciais e orientações"
            rows={3}
            className={textareaClass}
          />
        </Field>

        <Field label="Cor do pacote" error={errors.corHex}>
          <ColorPicker value={values.corHex} onChange={(corHex) => update({ corHex })} />
        </Field>

        <Field label="Itens inclusos">
          <ItemsEditor
            items={values.itensInclusos}
            onChange={(itensInclusos) => update({ itensInclusos })}
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
          <div>
            <p className="text-sm font-medium text-ink">Pacote ativo</p>
            <p className="text-[11px] text-muted">Pacotes arquivados não aparecem em novos ensaios.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.ativo}
            aria-label="Pacote ativo"
            onClick={() => update({ ativo: !values.ativo })}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
              values.ativo ? 'bg-brand-600' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                values.ativo ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Check className="size-4" />
            {pacote ? 'Salvar alterações' : 'Criar pacote'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

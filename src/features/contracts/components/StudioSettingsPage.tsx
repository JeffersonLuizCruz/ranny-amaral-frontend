import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Scale } from 'lucide-react'

import type { EstudioConfig } from '@/domain/contracts'
import { Button } from '@/shared/components/ui/Button'
import { Field, inputClass, textareaClass } from '@/shared/components/ui/Field'
import { useToastStore } from '@/shared/store/toastStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'

export function StudioSettingsPage() {
  const estudio = useStudioStore((state) => state.estudio)
  const updateEstudio = useStudioStore((state) => state.updateEstudio)
  const addToast = useToastStore((state) => state.addToast)
  const [values, setValues] = useState<EstudioConfig>(() => ({ ...estudio }))
  const [error, setError] = useState('')

  const update = (patch: Partial<EstudioConfig>) => {
    setValues((current) => ({ ...current, ...patch }))
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!values.nome.trim()) {
      setError('Informe o nome do estúdio.')
      return
    }

    updateEstudio({
      ...values,
      percentualEntradaPadrao: Math.max(0, Math.min(100, Number(values.percentualEntradaPadrao) || 0)),
      prazoPagamentoDias: values.prazoPagamentoDias
        ? Math.max(0, Number(values.prazoPagamentoDias) || 0)
        : undefined,
      nome: values.nome.trim(),
      razaoSocial: values.razaoSocial?.trim() || undefined,
      cnpj: values.cnpj?.trim() || undefined,
      endereco: values.endereco?.trim() || undefined,
      cidade: values.cidade?.trim() || undefined,
      estado: values.estado?.trim() || undefined,
      email: values.email?.trim() || undefined,
      telefone: values.telefone?.trim() || undefined,
      responsavel: values.responsavel?.trim() || undefined,
      site: values.site?.trim() || undefined,
      foro: values.foro?.trim() || undefined,
      chavePix: values.chavePix?.trim() || undefined,
      instrucoesPagamento: values.instrucoesPagamento?.trim() || undefined,
    })
    addToast('Dados do estúdio atualizados.')
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Scale className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Dados do estúdio</h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Esses dados alimentam as variáveis dos contratos e aparecem no cabeçalho
                do documento.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do estúdio" htmlFor="studio-name" error={error}>
                <input
                  id="studio-name"
                  value={values.nome}
                  onChange={(event) => update({ nome: event.target.value })}
                  className={inputClass}
                  aria-invalid={Boolean(error)}
                />
              </Field>
              <Field label="Razão social" htmlFor="studio-legal-name">
                <input
                  id="studio-legal-name"
                  value={values.razaoSocial ?? ''}
                  onChange={(event) => update({ razaoSocial: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CNPJ" htmlFor="studio-cnpj">
                <input
                  id="studio-cnpj"
                  value={values.cnpj ?? ''}
                  onChange={(event) => update({ cnpj: event.target.value })}
                  placeholder="00.000.000/0001-00"
                  className={inputClass}
                />
              </Field>
              <Field label="Responsável" htmlFor="studio-owner">
                <input
                  id="studio-owner"
                  value={values.responsavel ?? ''}
                  onChange={(event) => update({ responsavel: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Endereço" htmlFor="studio-address">
              <input
                id="studio-address"
                value={values.endereco ?? ''}
                onChange={(event) => update({ endereco: event.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Cidade" htmlFor="studio-city">
                <input
                  id="studio-city"
                  value={values.cidade ?? ''}
                  onChange={(event) => update({ cidade: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Estado" htmlFor="studio-state">
                <input
                  id="studio-state"
                  value={values.estado ?? ''}
                  onChange={(event) => update({ estado: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Foro" htmlFor="studio-forum">
                <input
                  id="studio-forum"
                  value={values.foro ?? ''}
                  onChange={(event) => update({ foro: event.target.value })}
                  placeholder="São Paulo/SP"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail" htmlFor="studio-email">
                <input
                  id="studio-email"
                  type="email"
                  value={values.email ?? ''}
                  onChange={(event) => update({ email: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Telefone" htmlFor="studio-phone">
                <input
                  id="studio-phone"
                  value={values.telefone ?? ''}
                  onChange={(event) => update({ telefone: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Site" htmlFor="studio-site">
              <input
                id="studio-site"
                value={values.site ?? ''}
                onChange={(event) => update({ site: event.target.value })}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Entrada padrão (%)" htmlFor="studio-deposit-percent">
                <input
                  id="studio-deposit-percent"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.percentualEntradaPadrao}
                  onChange={(event) =>
                    update({ percentualEntradaPadrao: Number(event.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Prazo de pagamento (dias)" htmlFor="studio-payment-deadline">
                <input
                  id="studio-payment-deadline"
                  type="number"
                  min={0}
                  step={1}
                  value={values.prazoPagamentoDias ?? ''}
                  onChange={(event) =>
                    update({
                      prazoPagamentoDias: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Chave Pix" htmlFor="studio-pix-key">
                <input
                  id="studio-pix-key"
                  value={values.chavePix ?? ''}
                  onChange={(event) => update({ chavePix: event.target.value })}
                  placeholder="pix@estudio.com.br"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Instruções de pagamento" htmlFor="studio-payment-instructions">
              <textarea
                id="studio-payment-instructions"
                value={values.instrucoesPagamento ?? ''}
                onChange={(event) => update({ instrucoesPagamento: event.target.value })}
                rows={3}
                placeholder="Ex.: Pague a entrada via Pix e anexe o comprovante no link do contrato."
                className={textareaClass}
              />
            </Field>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
              <p className="font-semibold">Aviso jurídico</p>
              <p className="mt-1">
                Os modelos são referências de trabalho. Revise o conteúdo com um advogado
                antes de usar os contratos em produção.
              </p>
            </div>

            <div className="flex justify-end border-t border-line pt-4">
              <Button type="submit">
                <Check className="size-4" />
                Salvar dados
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

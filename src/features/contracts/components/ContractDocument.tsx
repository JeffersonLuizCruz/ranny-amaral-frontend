import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { Contrato, DadosAceite } from '@/domain/contracts'
import { ENTRADA_STATUS_META, SALDO_FINAL_STATUS_META } from '@/domain/payments'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/currency'
import {
  formatAppointmentDate,
  formatDuration,
  formatTimeRange,
} from '@/shared/lib/date'

interface ContractDocumentProps {
  contrato: Contrato
  aceite?: DadosAceite
  className?: string
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function ContractDocument({
  contrato,
  aceite,
  className,
}: ContractDocumentProps) {
  const { snapshot } = contrato
  const { estudio, cliente, pacote, agendamento } = snapshot

  return (
    <article
      className={cn(
        'contract-print-root mx-auto w-full max-w-[210mm] rounded-2xl border border-line bg-white p-6 text-[12px] leading-relaxed text-ink shadow-card sm:p-10',
        className,
      )}
    >
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-semibold tracking-tight text-ink">
              {estudio.nome}
            </p>
            {estudio.razaoSocial ? (
              <p className="text-[11px] text-muted">{estudio.razaoSocial}</p>
            ) : null}
            <div className="mt-1 space-y-0.5 text-[11px] text-muted">
              {estudio.cnpj ? <p>CNPJ: {estudio.cnpj}</p> : null}
              {estudio.endereco ? (
                <p>
                  {estudio.endereco}
                  {estudio.cidade ? ` — ${estudio.cidade}` : ''}
                  {estudio.estado ? `/${estudio.estado}` : ''}
                </p>
              ) : null}
              {estudio.email || estudio.telefone ? (
                <p>
                  {[estudio.email, estudio.telefone].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Contrato
            </p>
            <p className="text-sm font-semibold text-ink">{contrato.numero}</p>
            <p className="text-[11px] text-muted">
              Emissão: {formatDate(contrato.dataEmissao)}
            </p>
            {contrato.dataValidade ? (
              <p className="text-[11px] text-muted">
                Validade: {formatDate(contrato.dataValidade)}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="py-6">
        <h1 className="text-center text-lg font-semibold tracking-tight text-ink">
          {contrato.titulo}
        </h1>

        <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-[11px] sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-wide text-muted">Contratado</p>
            <p className="mt-1 font-medium text-ink">{estudio.nome}</p>
            <p className="text-muted">{estudio.razaoSocial || '—'}</p>
            <p className="text-muted">CNPJ: {estudio.cnpj || '—'}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-muted">Contratante</p>
            <p className="mt-1 font-medium text-ink">{cliente.nome}</p>
            {cliente.whatsapp ? <p className="text-muted">{cliente.whatsapp}</p> : null}
            <p className="text-muted">{cliente.email || '—'}</p>
            {cliente.documento ? (
              <p className="text-muted">
                {cliente.tipoDocumento?.toUpperCase() ?? 'Documento'}: {cliente.documento}
              </p>
            ) : null}
            {cliente.cidade ? <p className="text-muted">Cidade: {cliente.cidade}</p> : null}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {contrato.clausulas.map((clausula) => (
            <section key={clausula.id} className="contract-clause">
              <h2 className="text-[12px] font-semibold text-ink">{clausula.titulo}</h2>
              <p className="mt-1 whitespace-pre-line text-[11.5px] text-slate-700">
                {clausula.corpo}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-[11px]">
          <p className="font-semibold text-ink">Resumo financeiro</p>
          <div className="mt-2 grid gap-1 text-slate-700 sm:grid-cols-2">
            <p>Valor total: {formatBRL(contrato.valorTotal)}</p>
            <p>Entrada: {formatBRL(contrato.valorEntrada)} ({contrato.percentualEntrada}%)</p>
            <p>Saldo restante: {formatBRL(contrato.saldoRestante)}</p>
            <p>Forma de pagamento: {contrato.formaPagamento}</p>
            <p>Status da entrada: {ENTRADA_STATUS_META[contrato.statusEntrada].label}</p>
            <p>Status do saldo final: {SALDO_FINAL_STATUS_META[contrato.statusSaldoFinal].label}</p>
            {pacote ? <p>Pacote: {pacote.nome}</p> : null}
            {pacote ? <p>Duração: {formatDuration(pacote.duracaoMinutos)}</p> : null}
            {agendamento ? (
              <p>Ensaio: {formatAppointmentDate(agendamento.dataHoraInicio, agendamento.dataHoraFim)}</p>
            ) : null}
            {agendamento ? (
              <p>Horário: {formatTimeRange(agendamento.dataHoraInicio, agendamento.dataHoraFim)}</p>
            ) : null}
            {agendamento ? <p>Local: {agendamento.local}</p> : null}
          </div>
          {contrato.condicoesPagamento ? (
            <p className="mt-2 text-slate-600">{contrato.condicoesPagamento}</p>
          ) : null}
        </div>

        {aceite ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-[11px]">
            <p className="font-semibold text-emerald-900">Aceite eletrônico registrado</p>
            <div className="mt-2 grid gap-1 text-emerald-900/80 sm:grid-cols-2">
              <p>Nome: {aceite.nomeCompleto}</p>
              <p>Documento: {aceite.documento}</p>
              <p>Cidade: {aceite.cidade}</p>
              <p>Data: {formatDate(aceite.aceitoEm)}</p>
              <p>Protocolo: {aceite.protocolo}</p>
              {aceite.hashConteudo ? (
                <p className="truncate">Hash: {aceite.hashConteudo}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <div className="border-t border-slate-400 pt-2 text-center text-[10px] text-muted">
            <p className="font-medium text-ink">{estudio.nome}</p>
            <p>{estudio.responsavel || 'Responsável pelo estúdio'}</p>
          </div>
          <div className="border-t border-slate-400 pt-2 text-center text-[10px] text-muted">
            <p className="font-medium text-ink">{aceite?.nomeCompleto ?? cliente.nome}</p>
            <p>Contratante</p>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] leading-relaxed text-slate-400">
          Documento gerado pelo Photoizer CRM. O aceite eletrônico registra nome, documento,
          cidade, data e hash do conteúdo. Para produção, recomenda-se revisão jurídica e
          integração com provedor de assinatura.
        </p>
      </div>
    </article>
  )
}

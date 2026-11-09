import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Link2,
  MessageCircle,
  XCircle,
} from 'lucide-react'

import type { Contrato } from '@/domain/contracts'
import { acceptanceAdapter } from '@/integrations/acceptance'
import { Button } from '@/shared/components/ui/Button'
import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'
import { whatsappLink } from '@/shared/lib/whatsapp'
import { useToastStore } from '@/shared/store/toastStore'
import { mensagemDeErro } from '@/shared/api/errors'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useLinksAceite } from '@/features/contracts/hooks/useLinksAceite'
import { AceiteStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import {
  acceptanceWhatsAppMessage,
  buildAcceptanceUrl,
} from '@/features/contracts/lib/acceptance'
import { copyContractLink } from '@/features/contracts/lib/shareLink'

function formatDateTime(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ContractAcceptancePanel({ contrato }: { contrato: Contrato }) {
  const { links, recarregar } = useLinksAceite(contrato.id)
  const addToast = useToastStore((state) => state.addToast)
  const reopenContract = useContractStore((state) => state.reopenContract)
  const recarregarContrato = useContractStore((state) => state.recarregarContrato)
  const [copied, setCopied] = useState(false)

  const solicitacao = useMemo(
    () =>
      [...links].sort(
        (a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime(),
      )[0],
    [links],
  )

  const activeLink =
    solicitacao &&
    ['pendente', 'visualizada'].includes(solicitacao.status) &&
    contrato.statusAceite === 'pendente'
      ? solicitacao
      : null

  const link = solicitacao ? buildAcceptanceUrl(solicitacao.token) : ''

  const handleCopy = async () => {
    try {
      const copiedLink = await copyContractLink(contrato)
      if (!copiedLink) {
        addToast('Não foi possível gerar o link do contrato.')
        return
      }

      setCopied(true)
      addToast('Link do contrato copiado.')
      window.setTimeout(() => setCopied(false), 2000)
      await Promise.all([
        recarregar(),
        recarregarContrato(contrato.id).catch(() => undefined),
      ])
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const handleReopen = async () => {
    try {
      await reopenContract(contrato.id)
      await recarregar()
      addToast('Contrato reaberto como rascunho.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  const cancelLink = async () => {
    if (!solicitacao) return
    if (!window.confirm('Cancelar o link de aceite? O contrato voltará para rascunho.')) {
      return
    }

    try {
      await acceptanceAdapter.cancel(contrato.id, solicitacao.id)
      await recarregar()
      await recarregarContrato(contrato.id)
      addToast('Link cancelado. O contrato voltou para rascunho.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Aceite do cliente</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            Copie o link e envie ao cliente para preencher os dados e aceitar.
          </p>
        </div>
        <AceiteStatusBadge status={contrato.statusAceite} />
      </div>

      {contrato.statusAceite === 'aceito' && contrato.aceite ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="size-4" />
            Aceite registrado
          </p>

          <dl className="mt-2 grid gap-1 text-[11px] text-emerald-900/80">
            <div className="flex justify-between gap-2">
              <dt>Nome</dt>
              <dd className="truncate font-medium">{contrato.aceite.nomeCompleto}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Documento</dt>
              <dd className="font-medium">
                {contrato.aceite.tipoDocumento.toUpperCase()}: {contrato.aceite.documento}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Cidade</dt>
              <dd className="font-medium">{contrato.aceite.cidade}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Data</dt>
              <dd className="font-medium">{formatDateTime(contrato.aceite.aceitoEm)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Protocolo</dt>
              <dd className="font-medium">{contrato.aceite.protocolo}</dd>
            </div>
            {contrato.aceite.hashConteudo ? (
              <div className="flex justify-between gap-2">
                <dt>Hash</dt>
                <dd className="max-w-[11rem] truncate font-mono text-[10px]">
                  {contrato.aceite.hashConteudo}
                </dd>
              </div>
            ) : null}
          </dl>

          {contrato.statusEntrada === 'pendente' ? (
            <div className="mt-3 border-t border-emerald-200 pt-2">
              <p className="text-[10px] text-emerald-900/80">
                Entrada pendente. O cliente pode usar o mesmo link para enviar o
                comprovante.
              </p>
              <Button size="sm" variant="secondary" className="mt-2" onClick={handleCopy}>
                <Copy className="size-3.5" />
                Copiar link para comprovante
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeLink ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-xs font-semibold text-amber-900">
            {activeLink.status === 'visualizada'
              ? 'Cliente abriu o link'
              : 'Aguardando o cliente abrir o link'}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Expira em {formatDateTime(activeLink.expiraEm)}.
          </p>

          <input
            readOnly
            value={link}
            aria-label="Link de aceite"
            onFocus={(event) => event.currentTarget.select()}
            className={cn(inputClass, 'mt-2 text-xs')}
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            {contrato.snapshot.cliente.whatsapp ? (
              <a
                href={whatsappLink(
                  contrato.snapshot.cliente.whatsapp,
                  acceptanceWhatsAppMessage(contrato, activeLink.token),
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={cancelLink}
            >
              <XCircle className="size-3.5" />
              Cancelar link
            </Button>
          </div>
        </div>
      ) : null}

      {['rascunho', 'expirado'].includes(contrato.statusAceite) ? (
        <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
          <p className="text-[11px] text-muted">
            {contrato.statusAceite === 'expirado'
              ? 'O link anterior expirou. Gere um novo link para o cliente.'
              : 'O contrato está em rascunho. Gere o link para enviar ao cliente.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" onClick={handleCopy}>
              <Link2 className="size-3.5" />
              {contrato.statusAceite === 'expirado'
                ? 'Gerar novo link'
                : 'Copiar link do contrato'}
            </Button>
            {contrato.statusAceite === 'expirado' ? (
              <Button size="sm" variant="secondary" onClick={handleReopen}>
                Reabrir rascunho
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {contrato.statusAceite === 'cancelado' ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-800">
          Este contrato foi cancelado. Duplique-o para criar uma nova versão.
        </div>
      ) : null}

      {contrato.statusAceite === 'pendente' && !activeLink ? (
        <div className="mt-3 rounded-xl border border-line bg-canvas/60 p-3">
          <p className="text-[11px] text-muted">
            Nenhum link ativo. Gere um novo link para o cliente.
          </p>
          <Button size="sm" className="mt-2" onClick={handleCopy}>
            <Link2 className="size-3.5" />
            Gerar link de aceite
          </Button>
        </div>
      ) : null}
    </section>
  )
}

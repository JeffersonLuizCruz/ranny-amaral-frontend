import type {
  Cliente,
  ClienteDraft,
} from '@/domain/types'
import type {
  Contrato,
  ContratoClausula,
  ContratoSnapshot,
  DadosAceite,
  DadosAceiteInput,
  SolicitacaoAceite,
} from '@/domain/contracts'
import type {
  ComprovantePagamento,
  PagamentoEntrada,
} from '@/domain/payments'
import { resolveContractClauses } from '@/domain/contractTemplate'
import { useAcceptanceStore } from '@/features/contracts/store/acceptanceStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import {
  hashContractContent,
  isAcceptanceExpired,
} from '@/features/contracts/lib/acceptance'
import { nextAcceptanceProtocol } from '@/features/contracts/lib/numbering'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import type {
  AcceptanceResult,
  ContractAcceptancePort,
  SubmitProofResult,
} from '@/integrations/acceptance/types'

function findRequest(token: string): SolicitacaoAceite | undefined {
  return useAcceptanceStore.getState().solicitacoes.find(
    (solicitacao) => solicitacao.token === token,
  )
}

function findContract(id: string): Contrato | undefined {
  return useContractStore.getState().contratos.find((contrato) => contrato.id === id)
}

function digitsOnly(value?: string): string {
  return value?.replace(/\D/g, '') ?? ''
}

function findExistingClient(
  contrato: Contrato,
  input: DadosAceiteInput,
): Cliente | undefined {
  const clientes = useClientStore.getState().clientes

  if (contrato.clienteId) {
    return clientes.find((cliente) => cliente.id === contrato.clienteId)
  }

  const document = digitsOnly(input.documento)
  if (document) {
    const byDocument = clientes.find(
      (cliente) => digitsOnly(cliente.documento) === document,
    )
    if (byDocument) return byDocument
  }

  const whatsapp = digitsOnly(input.whatsapp ?? contrato.snapshot.cliente.whatsapp)
  if (whatsapp) {
    return clientes.find((cliente) => digitsOnly(cliente.whatsapp) === whatsapp)
  }

  return undefined
}

function upsertClient(
  contrato: Contrato,
  input: DadosAceiteInput,
): { cliente: Cliente; created: boolean } {
  const store = useClientStore.getState()
  const existing = findExistingClient(contrato, input)

  if (existing) {
    const draft: ClienteDraft = {
      nome: input.nomeCompleto,
      whatsapp:
        input.whatsapp?.trim() ||
        existing.whatsapp ||
        contrato.snapshot.cliente.whatsapp ||
        '',
      email: existing.email ?? contrato.snapshot.cliente.email,
      documento: input.documento,
      tipoDocumento: input.tipoDocumento,
      cidade: input.cidade,
      origem: existing.origem,
      observacoes: existing.observacoes,
    }

    store.updateClient(existing.id, draft)
    const updated = useClientStore
      .getState()
      .clientes.find((cliente) => cliente.id === existing.id)

    return { cliente: updated ?? { ...existing, ...draft }, created: false }
  }

  const cliente = store.createClient({
    nome: input.nomeCompleto,
    whatsapp:
      input.whatsapp?.trim() || contrato.snapshot.cliente.whatsapp || '',
    email: contrato.snapshot.cliente.email,
    documento: input.documento,
    tipoDocumento: input.tipoDocumento,
    cidade: input.cidade,
    origem: 'contrato',
    observacoes: 'Cliente criado pelo aceite do contrato.',
  })

  return { cliente, created: true }
}

function buildAcceptedSnapshot(
  contrato: Contrato,
  input: DadosAceiteInput,
  cliente: Cliente,
): ContratoSnapshot {
  return {
    ...contrato.snapshot,
    cliente: {
      nome: input.nomeCompleto,
      whatsapp: input.whatsapp?.trim() || cliente.whatsapp || undefined,
      email: cliente.email,
      documento: input.documento,
      tipoDocumento: input.tipoDocumento,
      cidade: input.cidade,
    },
  }
}

function buildAcceptedClauses(
  contrato: Contrato,
  snapshot: ContratoSnapshot,
): ContratoClausula[] {
  if (!contrato.clausulasModelo) return contrato.clausulas

  return resolveContractClauses(contrato.clausulasModelo, {
    estudio: snapshot.estudio,
    cliente: {
      nome: snapshot.cliente.nome,
      whatsapp: snapshot.cliente.whatsapp ?? '',
      email: snapshot.cliente.email,
      documento: snapshot.cliente.documento,
      tipoDocumento: snapshot.cliente.tipoDocumento,
      cidade: snapshot.cliente.cidade,
    },
    pacote: snapshot.pacote,
    agendamento: snapshot.agendamento,
    contrato: {
      numero: contrato.numero,
      dataEmissao: contrato.dataEmissao,
      valorTotal: contrato.valorTotal,
      valorEntrada: contrato.valorEntrada,
      percentualEntrada: contrato.percentualEntrada,
      saldoRestante: contrato.saldoRestante,
      formaPagamento: contrato.formaPagamento,
      validade: contrato.dataValidade,
    },
  })
}

function buildPayment(
  contrato: Contrato,
  comprovante?: ComprovantePagamento,
): PagamentoEntrada {
  const proof = comprovante ?? contrato.pagamento.comprovante

  if (contrato.valorEntrada <= 0) {
    return {
      ...contrato.pagamento,
      valor: contrato.valorEntrada,
      percentual: contrato.percentualEntrada,
      status: 'isento',
      comprovante: undefined,
      rejeicao: undefined,
    }
  }

  if (contrato.statusPagamento === 'confirmado') {
    return {
      ...contrato.pagamento,
      valor: contrato.valorEntrada,
      percentual: contrato.percentualEntrada,
      status: 'confirmado',
      comprovante: proof,
      rejeicao: undefined,
    }
  }

  if (!proof) {
    throw new Error('Anexe o comprovante de pagamento da entrada.')
  }

  return {
    ...contrato.pagamento,
    valor: contrato.valorEntrada,
    percentual: contrato.percentualEntrada,
    status: 'pendente',
    comprovante: proof,
    rejeicao: undefined,
  }
}

export const localAcceptanceAdapter: ContractAcceptancePort = {
  mode: 'local',

  async createLink(contractId, expiresInDays) {
    const contrato = findContract(contractId)
    if (!contrato) throw new Error('Contrato não encontrado.')
    if (!['rascunho', 'expirado'].includes(contrato.statusAceite)) {
      throw new Error('Este contrato não pode receber um novo link de aceite.')
    }

    const solicitacao = useAcceptanceStore
      .getState()
      .createSolicitacao(contractId, expiresInDays)

    useContractStore.getState().markLinkGenerated(contractId, solicitacao.id)

    return solicitacao
  },

  async getByToken(token) {
    const solicitacao = findRequest(token)
    if (!solicitacao) return null

    const contrato = findContract(solicitacao.contratoId)
    if (!contrato) return null

    if (
      contrato.statusAceite === 'pendente' &&
      isAcceptanceExpired(solicitacao)
    ) {
      useAcceptanceStore.getState().expireSolicitacao(solicitacao.id)
      useContractStore.getState().markExpired(contrato.id)

      return {
        solicitacao: { ...solicitacao, status: 'expirada' },
        contrato: { ...contrato, statusAceite: 'expirado' },
      }
    }

    return { solicitacao, contrato }
  },

  async markViewed(token) {
    const solicitacao = findRequest(token)
    if (!solicitacao || solicitacao.status !== 'pendente') return

    const contrato = findContract(solicitacao.contratoId)
    if (!contrato || contrato.statusAceite !== 'pendente') return

    if (isAcceptanceExpired(solicitacao)) {
      useAcceptanceStore.getState().expireSolicitacao(solicitacao.id)
      useContractStore.getState().markExpired(contrato.id)
      return
    }

    useAcceptanceStore.getState().markViewed(token)
    useContractStore
      .getState()
      .addHistory(contrato.id, 'link_visualizado', 'Cliente abriu o link de aceite.')
  },

  async accept(token, input, comprovante): Promise<AcceptanceResult> {
    const solicitacao = findRequest(token)
    if (!solicitacao) throw new Error('Link de aceite não encontrado.')
    if (!['pendente', 'visualizada'].includes(solicitacao.status)) {
      throw new Error('Este link de aceite não está mais disponível.')
    }

    const contrato = findContract(solicitacao.contratoId)
    if (!contrato) throw new Error('Contrato não encontrado.')
    if (contrato.statusAceite !== 'pendente') {
      throw new Error('Este contrato não está aguardando aceite.')
    }

    if (isAcceptanceExpired(solicitacao)) {
      useAcceptanceStore.getState().expireSolicitacao(solicitacao.id)
      useContractStore.getState().markExpired(contrato.id)
      throw new Error('Este link de aceite expirou.')
    }

    const { cliente, created } = upsertClient(contrato, input)
    const snapshot = buildAcceptedSnapshot(contrato, input, cliente)
    const clausulas = buildAcceptedClauses(contrato, snapshot)
    const pagamento = buildPayment(contrato, comprovante)

    const protocolo = nextAcceptanceProtocol(
      useAcceptanceStore.getState().solicitacoes,
    )

    const dadosAceite: DadosAceite = {
      ...input,
      aceitoEm: new Date().toISOString(),
      protocolo,
      userAgent:
        typeof navigator === 'undefined' ? undefined : navigator.userAgent,
    }

    const contratoParaHash: Contrato = {
      ...contrato,
      clienteId: cliente.id,
      snapshot,
      clausulas,
      pagamento,
    }

    dadosAceite.hashConteudo = await hashContractContent(contratoParaHash, dadosAceite)

    useAcceptanceStore.getState().markAccepted(token, dadosAceite)
    useContractStore.getState().markAccepted(contrato.id, {
      aceite: dadosAceite,
      solicitacaoId: solicitacao.id,
      clienteId: cliente.id,
      snapshot,
      clausulas,
      pagamento,
    })

    if (contrato.agendamentoId) {
      useAppointmentStore.getState().linkClient(contrato.agendamentoId, cliente.id)
    }

    useContractStore
      .getState()
      .addHistory(
        contrato.id,
        created ? 'cliente_criado' : 'cliente_vinculado',
        created
          ? 'Cliente criado a partir do aceite do contrato.'
          : 'Contrato vinculado a um cliente existente.',
      )

    if (pagamento.comprovante) {
      useContractStore
        .getState()
        .addHistory(contrato.id, 'comprovante_enviado', 'Comprovante de pagamento enviado.')
    }

    const contratoAtualizado = findContract(contrato.id)
    const solicitacaoAtualizada = findRequest(token)

    if (!contratoAtualizado || !solicitacaoAtualizada) {
      throw new Error('Não foi possível concluir o aceite.')
    }

    return {
      protocolo,
      contrato: contratoAtualizado,
      solicitacao: solicitacaoAtualizada,
    }
  },

  async submitProof(token, comprovante): Promise<SubmitProofResult> {
    const solicitacao = findRequest(token)
    if (!solicitacao) throw new Error('Link de aceite não encontrado.')

    const contrato = findContract(solicitacao.contratoId)
    if (!contrato) throw new Error('Contrato não encontrado.')
    if (contrato.statusAceite !== 'aceito') {
      throw new Error('O contrato precisa ser aceito antes do envio do comprovante.')
    }
    if (['confirmado', 'isento'].includes(contrato.statusPagamento)) {
      throw new Error('O pagamento deste contrato já está confirmado.')
    }

    useContractStore.getState().registerProof(contrato.id, comprovante)

    const contratoAtualizado = findContract(contrato.id)
    const solicitacaoAtualizada = findRequest(token)

    if (!contratoAtualizado || !solicitacaoAtualizada) {
      throw new Error('Não foi possível registrar o comprovante.')
    }

    return { contrato: contratoAtualizado, solicitacao: solicitacaoAtualizada }
  },

  async cancel(linkId) {
    const solicitacao = useAcceptanceStore
      .getState()
      .solicitacoes.find((item) => item.id === linkId)

    if (!solicitacao) return

    useAcceptanceStore.getState().cancelSolicitacao(linkId)
    useContractStore
      .getState()
      .addHistory(solicitacao.contratoId, 'link_cancelado', 'Link de aceite cancelado.')
    useContractStore.getState().reopenContract(solicitacao.contratoId)
  },
}

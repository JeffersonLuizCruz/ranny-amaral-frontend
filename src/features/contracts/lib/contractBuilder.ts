import type {
  AgendamentoEnsaio,
  Cliente,
  PacoteFotografico,
} from '@/domain/types'
import type {
  ContratoDraft,
  ContratoSnapshot,
  EstudioConfig,
  ModeloContrato,
} from '@/domain/contracts'
import { resolveContractClauses } from '@/domain/contractTemplate'

interface BuildContractInput {
  numero: string
  appointment: AgendamentoEnsaio
  pacote: PacoteFotografico
  cliente?: Cliente
  studio: EstudioConfig
  template: ModeloContrato
}

function buildSnapshot(input: BuildContractInput): ContratoSnapshot {
  const { appointment, pacote, cliente, studio, template } = input
  const contato = appointment.contato
  const nome = cliente?.nome ?? contato?.nome?.trim() ?? 'A preencher'

  return {
    cliente: {
      nome,
      whatsapp: cliente?.whatsapp || contato?.whatsapp,
      email: cliente?.email,
      documento: cliente?.documento,
      tipoDocumento: cliente?.tipoDocumento,
      cidade: cliente?.cidade,
    },
    pacote: {
      nome: pacote.nome,
      duracaoMinutos: pacote.duracaoMinutos,
      valor: pacote.valor,
      itensInclusos: [...pacote.itensInclusos],
      quantidadeFotosInclusas:
        appointment.condicoesPacote?.quantidadeFotosInclusas ??
        pacote.quantidadeFotosInclusas,
      quantidadeVideosInclusos:
        appointment.condicoesPacote?.quantidadeVideosInclusos ??
        pacote.quantidadeVideosInclusos,
      valorFotoExtra:
        appointment.condicoesPacote?.valorFotoExtra ?? pacote.valorFotoExtra,
      promocaoAplicada: appointment.condicoesPacote?.promocaoAplicada,
      valorEfetivo: appointment.valorAcordado,
    },
    agendamento: {
      dataHoraInicio: appointment.dataHoraInicio,
      dataHoraFim: appointment.dataHoraFim,
      local: appointment.local,
      valorAcordado: appointment.valorAcordado,
    },
    // O snapshot do contrato não inclui a chave Pix de extras; ela é exclusiva
    // do fluxo da galeria.
    estudio: {
      nome: studio.nome,
      razaoSocial: studio.razaoSocial,
      cnpj: studio.cnpj,
      endereco: studio.endereco,
      cidade: studio.cidade,
      estado: studio.estado,
      email: studio.email,
      telefone: studio.telefone,
      responsavel: studio.responsavel,
      site: studio.site,
      foro: studio.foro,
      percentualEntradaPadrao: studio.percentualEntradaPadrao,
      chavePix: studio.chavePix,
      instrucoesPagamento: studio.instrucoesPagamento,
      prazoPagamentoDias: studio.prazoPagamentoDias,
    },
    modeloVersao: template.versao,
  }
}

export function buildContractDraftFromAppointment(
  input: BuildContractInput,
): ContratoDraft {
  const { numero, appointment, pacote, cliente, studio, template } = input
  const snapshot = buildSnapshot(input)
  const dataEmissao = new Date().toISOString()
  const formaPagamento = 'Pix'
  const valorTotal = appointment.valorAcordado
  const valorEntrada = appointment.valorEntrada
  const percentualEntrada = appointment.percentualEntrada
  const saldoRestante = appointment.saldoRestante
  const pagamentoFinal = appointment.pagamentoFinal ?? {
    valor: saldoRestante,
    status: saldoRestante > 0 ? ('pendente' as const) : ('isento' as const),
  }

  const clausulas = resolveContractClauses(template.clausulas, {
    estudio: studio,
    cliente: {
      nome: snapshot.cliente.nome,
      whatsapp: snapshot.cliente.whatsapp ?? '',
      email: snapshot.cliente.email,
      documento: snapshot.cliente.documento,
      tipoDocumento: snapshot.cliente.tipoDocumento,
      cidade: snapshot.cliente.cidade,
    },
    pacote: {
      nome: pacote.nome,
      duracaoMinutos: pacote.duracaoMinutos,
      valor: pacote.valor,
      itensInclusos: pacote.itensInclusos,
      quantidadeFotosInclusas:
        appointment.condicoesPacote?.quantidadeFotosInclusas ??
        pacote.quantidadeFotosInclusas,
      quantidadeVideosInclusos:
        appointment.condicoesPacote?.quantidadeVideosInclusos ??
        pacote.quantidadeVideosInclusos,
      valorFotoExtra:
        appointment.condicoesPacote?.valorFotoExtra ?? pacote.valorFotoExtra,
      promocaoAplicada: appointment.condicoesPacote?.promocaoAplicada,
      valorEfetivo: appointment.valorAcordado,
    },
    agendamento: {
      dataHoraInicio: appointment.dataHoraInicio,
      dataHoraFim: appointment.dataHoraFim,
      local: appointment.local,
      valorAcordado: appointment.valorAcordado,
    },
    contrato: {
      numero,
      dataEmissao,
      valorTotal,
      valorEntrada,
      percentualEntrada,
      saldoRestante,
      formaPagamento,
      validade: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  })

  return {
    clienteId: cliente?.id,
    agendamentoId: appointment.id,
    pacoteId: pacote.id,
    modeloId: template.id,
    titulo: template.nome,
    clausulas,
    clausulasModelo: template.clausulas,
    snapshot,
    valorTotal,
    valorEntrada,
    percentualEntrada,
    saldoRestante,
    pagamento: {
      ...appointment.pagamentoEntrada,
      valor: valorEntrada,
      percentual: percentualEntrada,
    },
    pagamentoFinal,
    formaPagamento,
    condicoesPagamento:
      'Entrada na reserva; saldo no dia do ensaio, via Pix ou dinheiro, registrado pelo estúdio.',
    dataEmissao,
    dataValidade: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    observacoes: appointment.observacoes,
  }
}

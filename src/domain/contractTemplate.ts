import { format } from 'date-fns'

import type { AgendamentoEnsaio, Cliente, FaixaFotoExtra, PacoteFotografico } from './types'
import type { ClausulaModelo, ContratoClausula, EstudioConfig } from './contracts'
import { formatBRL } from '@/shared/lib/currency'
import { formatDuration, formatTime } from '@/shared/lib/date'

export interface ContractTemplateContext {
  estudio: EstudioConfig
  cliente: Pick<
    Cliente,
    'nome' | 'whatsapp' | 'email' | 'documento' | 'tipoDocumento' | 'cidade'
  >
  pacote?: Pick<
    PacoteFotografico,
    | 'nome'
    | 'duracaoMinutos'
    | 'valor'
    | 'itensInclusos'
    | 'quantidadeFotosInclusas'
    | 'quantidadeVideosInclusos'
    | 'valorFotoExtra'
    | 'faixasFotoExtra'
  > & {
    promocaoAplicada?: { valorPromocional: number; rotulo?: string }
    valorEfetivo?: number
  }
  agendamento?: Pick<
    AgendamentoEnsaio,
    'dataHoraInicio' | 'dataHoraFim' | 'local' | 'valorAcordado'
  >
  contrato: {
    numero: string
    dataEmissao: string
    valorTotal: number
    valorEntrada: number
    percentualEntrada: number
    saldoRestante: number
    formaPagamento: string
    validade?: string
  }
}

export interface ContractVariable {
  token: string
  label: string
  group: 'Estúdio' | 'Cliente' | 'Pacote' | 'Agendamento' | 'Contrato'
  sample: string
}

export const CONTRACT_VARIABLES: ContractVariable[] = [
  { token: 'estudio.nome', label: 'Nome do estúdio', group: 'Estúdio', sample: 'Photoizer Estúdio' },
  { token: 'estudio.razaoSocial', label: 'Razão social', group: 'Estúdio', sample: 'Photoizer Fotografia LTDA' },
  { token: 'estudio.cnpj', label: 'CNPJ', group: 'Estúdio', sample: '00.000.000/0001-00' },
  { token: 'estudio.endereco', label: 'Endereço', group: 'Estúdio', sample: 'Rua das Flores, 123' },
  { token: 'estudio.cidade', label: 'Cidade', group: 'Estúdio', sample: 'São Paulo' },
  { token: 'estudio.estado', label: 'Estado', group: 'Estúdio', sample: 'SP' },
  { token: 'estudio.email', label: 'E-mail do estúdio', group: 'Estúdio', sample: 'contato@photoizer.com.br' },
  { token: 'estudio.telefone', label: 'Telefone', group: 'Estúdio', sample: '(11) 99999-9999' },
  { token: 'estudio.responsavel', label: 'Responsável', group: 'Estúdio', sample: 'Ana Souza' },
  { token: 'estudio.foro', label: 'Foro', group: 'Estúdio', sample: 'São Paulo/SP' },
  { token: 'estudio.percentualEntradaPadrao', label: 'Percentual padrão de entrada', group: 'Estúdio', sample: '30%' },
  { token: 'estudio.chavePix', label: 'Chave Pix', group: 'Estúdio', sample: 'pix@photoizer.com.br' },
  { token: 'estudio.instrucoesPagamento', label: 'Instruções de pagamento', group: 'Estúdio', sample: 'Pix ou transferência. Enviar comprovante.' },

  { token: 'cliente.nome', label: 'Nome do cliente', group: 'Cliente', sample: 'Marina Alves' },
  { token: 'cliente.whatsapp', label: 'WhatsApp', group: 'Cliente', sample: '(11) 99876-5432' },
  { token: 'cliente.email', label: 'E-mail', group: 'Cliente', sample: 'marina@email.com' },
  { token: 'cliente.documento', label: 'Documento (após aceite)', group: 'Cliente', sample: '529.982.247-25' },
  { token: 'cliente.cidade', label: 'Cidade do cliente', group: 'Cliente', sample: 'São Paulo' },

  { token: 'pacote.nome', label: 'Nome do pacote', group: 'Pacote', sample: 'Ensaio Gestante Standard' },
  { token: 'pacote.duracao', label: 'Duração', group: 'Pacote', sample: '1h30' },
  { token: 'pacote.valor', label: 'Valor do pacote', group: 'Pacote', sample: 'R$ 890,00' },
  { token: 'pacote.fotosInclusas', label: 'Fotos inclusas', group: 'Pacote', sample: '20' },
  { token: 'pacote.videosInclusos', label: 'Vídeos inclusos', group: 'Pacote', sample: '0' },
  { token: 'pacote.valorFotoExtra', label: 'Valor da foto extra', group: 'Pacote', sample: 'R$ 45,00' },
  { token: 'pacote.regraFotoExtra', label: 'Regra da foto extra', group: 'Pacote', sample: 'R$ 45,00 da 1ª à 10ª foto extra; R$ 30,00 da 11ª em diante' },
  { token: 'pacote.itens', label: 'Itens inclusos', group: 'Pacote', sample: '20 fotos tratadas; galeria online' },

  { token: 'agendamento.data', label: 'Data do ensaio', group: 'Agendamento', sample: '05/11/2026' },
  { token: 'agendamento.horario', label: 'Horário do ensaio', group: 'Agendamento', sample: '10:00 – 11:30' },
  { token: 'agendamento.local', label: 'Local do ensaio', group: 'Agendamento', sample: 'Estúdio Photoizer' },
  { token: 'agendamento.valor', label: 'Valor do ensaio', group: 'Agendamento', sample: 'R$ 890,00' },

  { token: 'contrato.numero', label: 'Número do contrato', group: 'Contrato', sample: 'CT-2026-0001' },
  { token: 'contrato.dataEmissao', label: 'Data de emissão', group: 'Contrato', sample: '03/11/2026' },
  { token: 'contrato.valorTotal', label: 'Valor total', group: 'Contrato', sample: 'R$ 890,00' },
  { token: 'contrato.valorEntrada', label: 'Valor da entrada', group: 'Contrato', sample: 'R$ 267,00' },
  { token: 'contrato.percentualEntrada', label: 'Percentual da entrada', group: 'Contrato', sample: '30%' },
  { token: 'contrato.saldoRestante', label: 'Saldo restante', group: 'Contrato', sample: 'R$ 623,00' },
  { token: 'contrato.formaPagamento', label: 'Forma de pagamento', group: 'Contrato', sample: 'Pix' },
  { token: 'contrato.validade', label: 'Validade do contrato', group: 'Contrato', sample: '10/11/2026' },
]

const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'dd/MM/yyyy')
}

function formatarRegraFotoExtra(
  valorBase?: number,
  faixas?: FaixaFotoExtra[],
): string {
  if (!faixas || faixas.length === 0) {
    return valorBase != null ? `${formatBRL(valorBase)} por foto extra` : '—'
  }
  const ordenadas = [...faixas]
    .filter((faixa) => faixa != null && faixa.quantidadeMinima > 0)
    .sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)
  if (ordenadas.length === 0) {
    return valorBase != null ? `${formatBRL(valorBase)} por foto extra` : '—'
  }
  const partes: string[] = []
  const primeira = ordenadas[0].quantidadeMinima
  if (primeira > 2) {
    partes.push(`${formatBRL(valorBase ?? 0)} da 1ª à ${primeira - 1}ª foto extra`)
  } else if (primeira === 2) {
    partes.push(`${formatBRL(valorBase ?? 0)} na 1ª foto extra`)
  }
  ordenadas.forEach((faixa, index) => {
    const proxima = index + 1 < ordenadas.length
      ? ordenadas[index + 1].quantidadeMinima
      : undefined
    if (proxima != null) {
      partes.push(
        `${formatBRL(faixa.valorUnitario)} da ${faixa.quantidadeMinima}ª à ${proxima - 1}ª foto extra`,
      )
    } else {
      partes.push(
        `${formatBRL(faixa.valorUnitario)} da ${faixa.quantidadeMinima}ª em diante`,
      )
    }
  })
  return partes.join('; ')
}

function buildTokens(context: ContractTemplateContext): Record<string, string> {
  const { estudio, cliente, pacote, agendamento, contrato } = context

  return {
    'estudio.nome': estudio.nome || '—',
    'estudio.razaoSocial': estudio.razaoSocial || '—',
    'estudio.cnpj': estudio.cnpj || '—',
    'estudio.endereco': estudio.endereco || '—',
    'estudio.cidade': estudio.cidade || '—',
    'estudio.estado': estudio.estado || '—',
    'estudio.email': estudio.email || '—',
    'estudio.telefone': estudio.telefone || '—',
    'estudio.responsavel': estudio.responsavel || '—',
    'estudio.foro': estudio.foro || '—',
    'estudio.percentualEntradaPadrao': `${estudio.percentualEntradaPadrao ?? 0}%`,
    'estudio.chavePix': estudio.chavePix || '—',
    'estudio.instrucoesPagamento': estudio.instrucoesPagamento || '—',

    'cliente.nome': cliente.nome || '—',
    'cliente.whatsapp': cliente.whatsapp || '—',
    'cliente.email': cliente.email || '—',
    'cliente.documento': cliente.documento || '—',
    'cliente.cidade': cliente.cidade || '—',

    'pacote.nome': pacote?.nome ?? '—',
    'pacote.duracao': pacote ? formatDuration(pacote.duracaoMinutos) : '—',
    'pacote.valor': pacote ? formatBRL(pacote.valorEfetivo ?? pacote.valor) : '—',
    'pacote.fotosInclusas':
      pacote?.quantidadeFotosInclusas != null
        ? String(pacote.quantidadeFotosInclusas)
        : '—',
    'pacote.videosInclusos':
      pacote?.quantidadeVideosInclusos != null
        ? String(pacote.quantidadeVideosInclusos)
        : '—',
    'pacote.valorFotoExtra':
      pacote?.valorFotoExtra != null ? formatBRL(pacote.valorFotoExtra) : '—',
    'pacote.regraFotoExtra': formatarRegraFotoExtra(
      pacote?.valorFotoExtra,
      pacote?.faixasFotoExtra,
    ),
    'pacote.itens': pacote?.itensInclusos.length ? pacote.itensInclusos.join('; ') : '—',

    'agendamento.data': formatDate(agendamento?.dataHoraInicio),
    'agendamento.horario': agendamento
      ? `${formatTime(agendamento.dataHoraInicio)} – ${formatTime(agendamento.dataHoraFim)}`
      : '—',
    'agendamento.local': agendamento?.local ?? '—',
    'agendamento.valor': agendamento ? formatBRL(agendamento.valorAcordado) : '—',

    'contrato.numero': contrato.numero || '—',
    'contrato.dataEmissao': formatDate(contrato.dataEmissao),
    'contrato.valorTotal': formatBRL(contrato.valorTotal),
    'contrato.valorEntrada': formatBRL(contrato.valorEntrada),
    'contrato.percentualEntrada': `${contrato.percentualEntrada}%`,
    'contrato.saldoRestante': formatBRL(contrato.saldoRestante),
    'contrato.formaPagamento': contrato.formaPagamento || '—',
    'contrato.validade': formatDate(contrato.validade),
  }
}

export function resolveContractText(
  text: string,
  context: ContractTemplateContext,
): string {
  const tokens = buildTokens(context)

  return text.replace(TOKEN_PATTERN, (match, token: string) => tokens[token] ?? match)
}

export function resolveContractClauses(
  clauses: ClausulaModelo[],
  context: ContractTemplateContext,
): ContratoClausula[] {
  return clauses.map((clause) => ({
    id: clause.id,
    titulo: clause.titulo,
    corpo: resolveContractText(clause.corpo, context),
  }))
}

export function unknownContractVariables(text: string): string[] {
  const known = new Set(CONTRACT_VARIABLES.map((variable) => variable.token))
  const found = new Set<string>()

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const token = match[1]
    if (token && !known.has(token)) found.add(token)
  }

  return [...found]
}

export function createSampleContractContext(): ContractTemplateContext {
  return {
    estudio: {
      nome: 'Photoizer Estúdio',
      razaoSocial: 'Photoizer Fotografia LTDA',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      email: 'contato@photoizer.com.br',
      telefone: '(11) 99999-9999',
      responsavel: 'Ana Souza',
      foro: 'São Paulo/SP',
      percentualEntradaPadrao: 30,
      chavePix: 'pix@photoizer.com.br',
      instrucoesPagamento: 'Pix ou transferência. Enviar comprovante.',
    },
    cliente: {
      nome: 'Marina Alves',
      whatsapp: '(11) 99876-5432',
      email: 'marina@email.com',
      documento: '529.982.247-25',
      tipoDocumento: 'cpf',
      cidade: 'São Paulo',
    },
    pacote: {
      nome: 'Ensaio Gestante Standard',
      duracaoMinutos: 90,
      valor: 890,
      quantidadeFotosInclusas: 20,
      quantidadeVideosInclusos: 0,
      valorFotoExtra: 45,
      itensInclusos: ['20 fotos tratadas', 'Galeria online'],
    },
    agendamento: {
      dataHoraInicio: new Date().toISOString(),
      dataHoraFim: new Date(Date.now() + 90 * 60_000).toISOString(),
      local: 'Estúdio Photoizer',
      valorAcordado: 890,
    },
    contrato: {
      numero: 'CT-2026-0001',
      dataEmissao: new Date().toISOString(),
      valorTotal: 890,
      valorEntrada: 267,
      percentualEntrada: 30,
      saldoRestante: 623,
      formaPagamento: 'Pix',
      validade: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  }
}

import type {
  AgendamentoEnsaio,
  Cliente,
  PacoteFotografico,
} from './types'
import type {
  Contrato,
  ContratoAceiteStatus,
  ContratoSnapshot,
  DadosAceite,
  EstudioConfig,
  ModeloContrato,
  SolicitacaoAceite,
} from './contracts'
import type { PagamentoEntrada } from './payments'
import { resolveContractClauses } from './contractTemplate'
import { createSeedData } from './seed'
import { createId } from '@/shared/lib/id'

export interface ContractSeedData {
  studio: EstudioConfig
  templates: ModeloContrato[]
  contracts: Contrato[]
  acceptanceRequests: SolicitacaoAceite[]
}

interface SeedClientData {
  id?: string
  nome: string
  whatsapp?: string
  email?: string
  documento?: string
  tipoDocumento?: 'rg' | 'cpf'
  cidade?: string
}

function findCliente(clientes: Cliente[], id: string): Cliente {
  const cliente = clientes.find((item) => item.id === id)
  if (!cliente) throw new Error(`Cliente de seed não encontrado: ${id}`)
  return cliente
}

function findPacote(pacotes: PacoteFotografico[], id: string): PacoteFotografico {
  const pacote = pacotes.find((item) => item.id === id)
  if (!pacote) throw new Error(`Pacote de seed não encontrado: ${id}`)
  return pacote
}

function findAgendamento(
  agendamentos: AgendamentoEnsaio[],
  id: string,
): AgendamentoEnsaio {
  const agendamento = agendamentos.find((item) => item.id === id)
  if (!agendamento) throw new Error(`Agendamento de seed não encontrado: ${id}`)
  return agendamento
}

function buildSnapshot(
  cliente: SeedClientData,
  pacote: PacoteFotografico,
  agendamento: AgendamentoEnsaio,
  estudio: EstudioConfig,
  modeloVersao: number,
): ContratoSnapshot {
  return {
    cliente: {
      nome: cliente.nome,
      whatsapp: cliente.whatsapp,
      email: cliente.email,
      documento: cliente.documento,
      tipoDocumento: cliente.tipoDocumento,
      cidade: cliente.cidade,
    },
    pacote: {
      nome: pacote.nome,
      duracaoMinutos: pacote.duracaoMinutos,
      valor: pacote.valor,
      itensInclusos: [...pacote.itensInclusos],
      quantidadeFotosInclusas:
        agendamento.condicoesPacote?.quantidadeFotosInclusas ??
        pacote.quantidadeFotosInclusas,
      quantidadeVideosInclusos:
        agendamento.condicoesPacote?.quantidadeVideosInclusos ??
        pacote.quantidadeVideosInclusos,
      valorFotoExtra:
        agendamento.condicoesPacote?.valorFotoExtra ?? pacote.valorFotoExtra,
      promocaoAplicada: agendamento.condicoesPacote?.promocaoAplicada,
      valorEfetivo: agendamento.valorAcordado,
    },
    agendamento: {
      dataHoraInicio: agendamento.dataHoraInicio,
      dataHoraFim: agendamento.dataHoraFim,
      local: agendamento.local,
      valorAcordado: agendamento.valorAcordado,
    },
    estudio: { ...estudio },
    modeloVersao,
  }
}

export function createContractSeedData(): ContractSeedData {
  const now = new Date()
  const timestamp = now.toISOString()
  const year = now.getFullYear()
  const core = createSeedData()

  const studio: EstudioConfig = {
    nome: 'Photoizer Estúdio',
    razaoSocial: 'Photoizer Fotografia LTDA',
    cnpj: '00.000.000/0001-00',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    email: 'contato@photoizer.com.br',
    telefone: '(11) 99999-9999',
    responsavel: 'Ana Souza',
    site: 'www.photoizer.com.br',
    foro: 'São Paulo/SP',
    percentualEntradaPadrao: 30,
    chavePix: 'pix@photoizer.com.br',
    instrucoesPagamento:
      'Pague a entrada via Pix e anexe o comprovante nesta página. O saldo restante pode ser quitado no dia do ensaio.',
    prazoPagamentoDias: 3,
  }

  const template: ModeloContrato = {
    id: 'tpl-padrao',
    nome: 'Contrato de Prestação de Serviços Fotográficos',
    descricao:
      'Modelo padrão para ensaios fotográficos, com cláusulas de entrega, direitos de imagem, pagamento, cancelamento e LGPD.',
    ativo: true,
    versao: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    clausulas: [
      {
        id: 'cl-objeto',
        titulo: '1. Objeto',
        corpo:
          'O presente contrato tem por objeto a prestação de serviços fotográficos por {{estudio.nome}}, inscrito no CNPJ {{estudio.cnpj}}, com sede em {{estudio.endereco}}, {{estudio.cidade}}/{{estudio.estado}}, ao contratante {{cliente.nome}}, WhatsApp {{cliente.whatsapp}} e e-mail {{cliente.email}}.',
      },
      {
        id: 'cl-servicos',
        titulo: '2. Serviços contratados e entregas',
        corpo:
          'O pacote contratado é {{pacote.nome}}, com duração de {{pacote.duracao}}, no valor de {{pacote.valor}}. Estão inclusos: {{pacote.itens}}. O pacote inclui {{pacote.fotosInclusas}} fotos e {{pacote.videosInclusos}} vídeos. Cada foto adicional custa {{pacote.valorFotoExtra}}. O ensaio ocorrerá em {{agendamento.data}}, das {{agendamento.horario}}, em {{agendamento.local}}. A galeria será disponibilizada em até 30 dias após o ensaio, com prazo de seleção de 30 dias, salvo prazo diverso informado por escrito.',
      },
      {
        id: 'cl-imagem',
        titulo: '3. Direitos autorais e uso de imagem',
        corpo:
          'O contratante autoriza o uso das imagens para portfólio, site e redes sociais do estúdio, salvo manifestação expressa em contrário por escrito. O contratante declara ser maior de idade e responsável pelas pessoas retratadas, quando aplicável.',
      },
      {
        id: 'cl-pagamento',
        titulo: '4. Valor e forma de pagamento',
        corpo:
          'O valor total do pacote é {{contrato.valorTotal}}. A entrada é de {{contrato.valorEntrada}} ({{contrato.percentualEntrada}}), restando {{contrato.saldoRestante}} para quitar até o dia do ensaio. O saldo final é recebido pelo estúdio via Pix ou em dinheiro e registrado no sistema. O pagamento deve ser feito via {{contrato.formaPagamento}}. Chave Pix: {{estudio.chavePix}}. Instruções: {{estudio.instrucoesPagamento}}.',
      },
      {
        id: 'cl-cancelamento',
        titulo: '5. Cancelamento e remarcação',
        corpo:
          'Cancelamentos com mais de 7 dias de antecedência permitem remarcação sem custo, sujeita à disponibilidade. Cancelamentos com menos de 7 dias podem implicar retenção da entrada. Faltas sem aviso podem ser tratadas como ensaio realizado para fins de cobrança.',
      },
      {
        id: 'cl-lgpd',
        titulo: '6. Proteção de dados (LGPD)',
        corpo:
          'Os dados pessoais informados serão utilizados exclusivamente para execução deste contrato, comunicação com o contratante e cumprimento de obrigações legais. O tratamento observará a Lei nº 13.709/2018 (LGPD).',
      },
      {
        id: 'cl-gerais',
        titulo: '7. Disposições gerais',
        corpo:
          'Este contrato representa o acordo integral entre as partes. Qualquer alteração deve ser registrada por escrito. Fica eleito o foro de {{estudio.foro}} para dirimir eventuais conflitos. A aceitação eletrônica deste documento pelo cliente possui validade entre as partes.',
      },
    ],
  }

  const marina = findCliente(core.clients, 'cli-marina')
  const gestante = findPacote(core.packages, 'pkg-gestante')
  const corporativo = findPacote(core.packages, 'pkg-corporativo')
  const familia = findPacote(core.packages, 'pkg-familia')
  const aptGestante = findAgendamento(core.appointments, 'apt-001')
  const aptCorporativo = findAgendamento(core.appointments, 'apt-002')
  const aptFamilia = findAgendamento(core.appointments, 'apt-003')

  const marinaData: SeedClientData = {
    id: marina.id,
    nome: marina.nome,
    whatsapp: marina.whatsapp,
    email: marina.email,
    documento: marina.documento,
    tipoDocumento: marina.tipoDocumento,
    cidade: marina.cidade,
  }

  const julianaData: SeedClientData = {
    nome: 'Juliana Prado',
    whatsapp: '(11) 91234-5678',
  }

  const makeContract = (
    id: string,
    numero: string,
    clienteData: SeedClientData,
    pacote: PacoteFotografico,
    agendamento: AgendamentoEnsaio,
    statusAceite: ContratoAceiteStatus,
    pagamento: PagamentoEntrada,
    extra: Partial<Contrato> = {},
  ): Contrato => {
    const dataEmissao = extra.dataEmissao ?? timestamp
    const valorTotal = extra.valorTotal ?? agendamento.valorAcordado
    const valorEntrada = extra.valorEntrada ?? pagamento.valor
    const percentualEntrada = extra.percentualEntrada ?? pagamento.percentual
    const saldoRestante = extra.saldoRestante ?? Math.max(0, valorTotal - valorEntrada)
    const pagamentoFinal =
      extra.pagamentoFinal ?? {
        valor: saldoRestante,
        status: saldoRestante > 0 ? 'pendente' : 'isento',
      }
    const statusPagamentoFinal = extra.statusPagamentoFinal ?? pagamentoFinal.status
    const formaPagamento = extra.formaPagamento ?? 'Pix'
    const clausulas = resolveContractClauses(template.clausulas, {
      estudio: studio,
      cliente: {
        nome: clienteData.nome,
        whatsapp: clienteData.whatsapp ?? '',
        email: clienteData.email,
        documento: clienteData.documento,
        tipoDocumento: clienteData.tipoDocumento,
        cidade: clienteData.cidade,
      },
      pacote: {
        nome: pacote.nome,
        duracaoMinutos: pacote.duracaoMinutos,
        valor: pacote.valor,
        itensInclusos: pacote.itensInclusos,
        quantidadeFotosInclusas:
          agendamento.condicoesPacote?.quantidadeFotosInclusas ??
          pacote.quantidadeFotosInclusas,
        quantidadeVideosInclusos:
          agendamento.condicoesPacote?.quantidadeVideosInclusos ??
          pacote.quantidadeVideosInclusos,
        valorFotoExtra:
          agendamento.condicoesPacote?.valorFotoExtra ?? pacote.valorFotoExtra,
        promocaoAplicada: agendamento.condicoesPacote?.promocaoAplicada,
        valorEfetivo: agendamento.valorAcordado,
      },
      agendamento: {
        dataHoraInicio: agendamento.dataHoraInicio,
        dataHoraFim: agendamento.dataHoraFim,
        local: agendamento.local,
        valorAcordado: agendamento.valorAcordado,
      },
      contrato: {
        numero,
        dataEmissao,
        valorTotal,
        valorEntrada,
        percentualEntrada,
        saldoRestante,
        formaPagamento,
        validade: extra.dataValidade,
      },
    })

    return {
      id,
      numero,
      clienteId: clienteData.id,
      agendamentoId: agendamento.id,
      pacoteId: pacote.id,
      modeloId: template.id,
      statusAceite,
      statusPagamento: pagamento.status,
      titulo: template.nome,
      clausulas,
      clausulasModelo: template.clausulas,
      snapshot: buildSnapshot(clienteData, pacote, agendamento, studio, template.versao),
      valorTotal,
      valorEntrada,
      percentualEntrada,
      saldoRestante,
      pagamento,
      pagamentoFinal,
      statusPagamentoFinal,
      formaPagamento,
      condicoesPagamento:
        'Entrada na reserva; saldo no dia do ensaio, via Pix ou dinheiro, registrado pelo estúdio.',
      dataEmissao,
      dataValidade: extra.dataValidade,
      solicitacaoAtualId: extra.solicitacaoAtualId,
      aceite: extra.aceite,
      observacoes: extra.observacoes,
      historico: extra.historico ?? [],
      createdAt: extra.createdAt ?? timestamp,
      updatedAt: extra.updatedAt ?? timestamp,
    }
  }

  const aceiteFamilia: DadosAceite = {
    nomeCompleto: 'Marina Alves',
    tipoDocumento: 'cpf',
    documento: '529.982.247-25',
    cidade: 'São Paulo',
    whatsapp: '(11) 99876-5432',
    aceitoEm: new Date(now.getTime() - 2 * 86_400_000).toISOString(),
    protocolo: `ACE-${year}-0001`,
    userAgent: 'Demo Photoizer CRM',
    hashConteudo: 'demo-hash-aceite-familia',
  }

  const contracts: Contrato[] = [
    makeContract(
      'ct-001',
      `CT-${year}-0001`,
      marinaData,
      gestante,
      aptGestante,
      'pendente',
      {
        valor: 267,
        percentual: 30,
        status: 'pendente',
      },
      {
        solicitacaoAtualId: 'req-001',
        dataValidade: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
        historico: [
          {
            id: createId('evt'),
            tipo: 'criado',
            em: new Date(now.getTime() - 3_600_000).toISOString(),
            detalhe: 'Contrato criado a partir da reserva de Marina Alves.',
          },
          {
            id: createId('evt'),
            tipo: 'link_gerado',
            em: new Date(now.getTime() - 1_800_000).toISOString(),
            detalhe: 'Link de aceite gerado com validade de 7 dias.',
          },
        ],
      },
    ),
    makeContract(
      'ct-002',
      `CT-${year}-0002`,
      julianaData,
      corporativo,
      aptCorporativo,
      'rascunho',
      {
        valor: 447,
        percentual: 30,
        status: 'pendente',
      },
      {
        historico: [
          {
            id: createId('evt'),
            tipo: 'criado',
            em: new Date(now.getTime() - 7_200_000).toISOString(),
            detalhe: 'Contrato criado automaticamente a partir de uma reserva sem cliente.',
          },
        ],
      },
    ),
    makeContract(
      'ct-003',
      `CT-${year}-0003`,
      marinaData,
      familia,
      aptFamilia,
      'aceito',
      {
        valor: 177,
        percentual: 30,
        status: 'confirmado',
        confirmadoEm: new Date(now.getTime() - 2 * 86_400_000).toISOString(),
        confirmadoPor: 'Equipe Photoizer',
      },
      {
        solicitacaoAtualId: 'req-003',
        aceite: aceiteFamilia,
        dataValidade: new Date(now.getTime() + 4 * 86_400_000).toISOString(),
        pagamentoFinal: {
          valor: 413,
          status: 'confirmado',
          formaPagamento: 'dinheiro',
          recebidoEm: new Date(now.getTime() - 1 * 86_400_000).toISOString(),
          recebidoPor: 'Equipe Photoizer',
        },
        statusPagamentoFinal: 'confirmado',
        historico: [
          {
            id: createId('evt'),
            tipo: 'criado',
            em: new Date(now.getTime() - 5 * 86_400_000).toISOString(),
            detalhe: 'Contrato criado a partir da reserva de família.',
          },
          {
            id: createId('evt'),
            tipo: 'link_gerado',
            em: new Date(now.getTime() - 4 * 86_400_000).toISOString(),
            detalhe: 'Link de aceite gerado.',
          },
          {
            id: createId('evt'),
            tipo: 'aceite_registrado',
            em: aceiteFamilia.aceitoEm,
            detalhe: `Aceite registrado com protocolo ${aceiteFamilia.protocolo}.`,
          },
          {
            id: createId('evt'),
            tipo: 'pagamento_confirmado',
            em: new Date(now.getTime() - 2 * 86_400_000).toISOString(),
            detalhe: 'Entrada confirmada pela equipe.',
          },
        ],
      },
    ),
  ]

  const acceptanceRequests: SolicitacaoAceite[] = [
    {
      id: 'req-001',
      contratoId: 'ct-001',
      token: 'demo-aceite-marina',
      status: 'pendente',
      criadaEm: new Date(now.getTime() - 1_800_000).toISOString(),
      expiraEm: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    },
    {
      id: 'req-003',
      contratoId: 'ct-003',
      token: 'demo-aceite-familia',
      status: 'aceita',
      criadaEm: new Date(now.getTime() - 4 * 86_400_000).toISOString(),
      expiraEm: new Date(now.getTime() + 3 * 86_400_000).toISOString(),
      visualizadaEm: new Date(now.getTime() - 4 * 86_400_000).toISOString(),
      dadosAceite: aceiteFamilia,
    },
  ]

  return {
    studio,
    templates: [template],
    contracts,
    acceptanceRequests,
  }
}

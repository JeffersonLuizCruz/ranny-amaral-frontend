import type { AgendamentoEnsaio, Cliente, PacoteFotografico } from './types'

type AgendamentoSeed = Omit<
  AgendamentoEnsaio,
  | 'statusEntrada'
  | 'statusSaldoFinal'
  | 'entradaQuitada'
  | 'saldoQuitado'
  | 'quitado'
  | 'valorRecebido'
  | 'valorPendente'
>

function enriquecerPagamento(appointment: AgendamentoSeed): AgendamentoEnsaio {
  const statusEntrada = appointment.pagamentoEntrada.status
  const statusSaldoFinal =
    appointment.pagamentoFinal?.status ??
    (appointment.saldoRestante > 0 ? 'pendente' : 'isento')
  const entradaQuitada =
    statusEntrada === 'confirmado' || statusEntrada === 'isento'
  const saldoQuitado =
    statusSaldoFinal === 'confirmado' || statusSaldoFinal === 'isento'
  const valorRecebido =
    (statusEntrada === 'confirmado' ? appointment.pagamentoEntrada.valor : 0) +
    (statusSaldoFinal === 'confirmado'
      ? (appointment.pagamentoFinal?.valor ?? 0)
      : 0)
  const valorPendente =
    (statusEntrada === 'pendente' ? appointment.pagamentoEntrada.valor : 0) +
    (statusSaldoFinal === 'pendente'
      ? (appointment.pagamentoFinal?.valor ?? appointment.saldoRestante)
      : 0)

  return {
    ...appointment,
    statusEntrada,
    statusSaldoFinal,
    entradaQuitada,
    saldoQuitado,
    quitado: entradaQuitada && saldoQuitado,
    valorRecebido,
    valorPendente,
  }
}

export interface SeedData {
  packages: PacoteFotografico[]
  clients: Cliente[]
  appointments: AgendamentoEnsaio[]
}

function at(day: number, hours: number, minutes = 0): string {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), day, hours, minutes, 0, 0).toISOString()
}

/**
 * Dados de demonstração relativos ao mês corrente.
 * Os IDs são estáveis para que as referências entre as stores continuem válidas.
 */
export function createSeedData(): SeedData {
  const now = new Date()
  const timestamp = now.toISOString()

  const packages: PacoteFotografico[] = [
    {
      id: 'pkg-gestante',
      nome: 'Ensaio Gestante Standard',
      duracaoMinutos: 90,
      valor: 890,
      descricao: 'Ensaio em estúdio com direção de poses e iluminação suave.',
      corHex: '#7C3AED',
      itensInclusos: [
        '1 look com troca',
        '20 fotos tratadas',
        'Galeria online por 90 dias',
        '1 impressão 20x30',
      ],
      quantidadeFotosInclusas: 20,
      quantidadeVideosInclusos: 0,
      valorFotoExtra: 45,
      promocao: {
        ativa: true,
        valorPromocional: 690,
        rotulo: 'Condição especial de lançamento',
      },
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'pkg-corporativo',
      nome: 'Ensaio Corporativo Premium',
      duracaoMinutos: 120,
      valor: 1490,
      descricao: 'Retratos profissionais para equipes, executivos e LinkedIn.',
      corHex: '#0284C7',
      itensInclusos: [
        '2 looks',
        '40 fotos tratadas',
        '1 vídeo institucional curto',
        'Retoque premium',
        'Licença de uso comercial',
        'Galeria online por 180 dias',
      ],
      quantidadeFotosInclusas: 40,
      quantidadeVideosInclusos: 1,
      valorFotoExtra: 55,
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'pkg-familia',
      nome: 'Ensaio Família Essencial',
      duracaoMinutos: 60,
      valor: 590,
      descricao: 'Registro afetivo em estúdio ou externo, com direção leve e natural.',
      corHex: '#D97706',
      itensInclusos: [
        '1 look',
        '15 fotos tratadas',
        'Galeria online por 60 dias',
        '1 foto impressa',
      ],
      quantidadeFotosInclusas: 15,
      quantidadeVideosInclusos: 0,
      valorFotoExtra: 35,
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'pkg-retrato-promo',
      nome: 'Ensaio Retrato Promocional',
      duracaoMinutos: 45,
      valor: 300,
      descricao: 'Pacote promocional de retratos com 20 fotos por um valor fechado.',
      corHex: '#E11D48',
      itensInclusos: ['20 fotos tratadas', 'Galeria online por 30 dias'],
      quantidadeFotosInclusas: 20,
      quantidadeVideosInclusos: 0,
      valorFotoExtra: 15,
      promocao: {
        ativa: true,
        valorPromocional: 200,
        rotulo: 'Leve 20 fotos por R$ 10 cada',
      },
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const clients: Cliente[] = [
    {
      id: 'cli-marina',
      nome: 'Marina Alves',
      whatsapp: '(11) 99876-5432',
      email: 'marina.alves@email.com',
      documento: '529.982.247-25',
      tipoDocumento: 'cpf',
      cidade: 'São Paulo',
      origem: 'instagram',
      observacoes: 'Prefere tons neutros e luz natural.',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'cli-rafael',
      nome: 'Rafael Costa',
      whatsapp: '(11) 98765-4321',
      email: 'rafael.costa@email.com',
      documento: '12.345.678-9',
      tipoDocumento: 'rg',
      cidade: 'São Paulo',
      origem: 'indicacao',
      observacoes: 'Contato corporativo. Aprovação passa pelo RH.',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const appointmentsSeed: AgendamentoSeed[] = [
    {
      id: 'apt-001',
      clienteId: 'cli-marina',
      contratoId: 'ct-001',
      pacoteId: 'pkg-gestante',
      dataHoraInicio: at(5, 10, 0),
      dataHoraFim: at(5, 11, 30),
      local: 'Estúdio Photoizer',
      status: 'reservado',
      observacoes: 'Levar looks neutros. Confirmar horário no dia anterior.',
      valorAcordado: 890,
      valorEntrada: 267,
      percentualEntrada: 30,
      saldoRestante: 623,
      pagamentoEntrada: {
        valor: 267,
        percentual: 30,
        status: 'pendente',
      },
      condicoesPacote: {
        quantidadeFotosInclusas: 20,
        quantidadeVideosInclusos: 0,
        valorFotoExtra: 45,
        valorTabela: 890,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'apt-002',
      contato: {
        nome: 'Juliana Prado',
        whatsapp: '(11) 91234-5678',
      },
      contratoId: 'ct-002',
      pacoteId: 'pkg-corporativo',
      dataHoraInicio: at(12, 14, 0),
      dataHoraFim: at(12, 16, 0),
      local: 'Escritório do cliente',
      status: 'reservado',
      observacoes: 'Reserva criada sem cliente. Contrato em rascunho aguardando envio.',
      valorAcordado: 1490,
      valorEntrada: 447,
      percentualEntrada: 30,
      saldoRestante: 1043,
      pagamentoEntrada: {
        valor: 447,
        percentual: 30,
        status: 'pendente',
      },
      condicoesPacote: {
        quantidadeFotosInclusas: 40,
        quantidadeVideosInclusos: 1,
        valorFotoExtra: 55,
        valorTabela: 1490,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'apt-003',
      clienteId: 'cli-marina',
      contratoId: 'ct-003',
      pacoteId: 'pkg-familia',
      dataHoraInicio: at(20, 9, 0),
      dataHoraFim: at(20, 10, 0),
      local: 'Parque Ibirapuera (externo)',
      status: 'realizado',
      observacoes: 'Ensaio realizado. Saldo final recebido em dinheiro.',
      valorAcordado: 590,
      valorEntrada: 177,
      percentualEntrada: 30,
      saldoRestante: 413,
      pagamentoEntrada: {
        valor: 177,
        percentual: 30,
        status: 'confirmado',
        confirmadoEm: new Date(now.getTime() - 3 * 86_400_000).toISOString(),
        confirmadoPor: 'Equipe Photoizer',
      },
      pagamentoFinal: {
        valor: 413,
        status: 'confirmado',
        formaPagamento: 'dinheiro',
        recebidoEm: new Date(now.getTime() - 1 * 86_400_000).toISOString(),
        recebidoPor: 'Equipe Photoizer',
      },
      condicoesPacote: {
        quantidadeFotosInclusas: 15,
        quantidadeVideosInclusos: 0,
        valorFotoExtra: 35,
        valorTabela: 590,
      },
      galeriaId: 'gal-001',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  const appointments = appointmentsSeed.map(enriquecerPagamento)

  return { packages, clients, appointments }
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  EventoGaleria,
  EventoGaleriaTipo,
  GaleriaEnsaio,
  MidiaGaleria,
  PedidoExtras,
  SelecaoGaleria,
} from '@/domain/galleries'
import { createGallerySeedData } from '@/domain/gallerySeed'
import type { FormaPagamentoSaldo } from '@/domain/payments'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import {
  getCondicoesGaleria,
  selecaoExpirada,
  validarSelecao,
} from '@/features/galleries/lib/selection'
import { createId } from '@/shared/lib/id'

const STORAGE_KEY = 'photoizer.crm.galleries.v1'
const SELECTION_DAYS = 30
const DELIVERY_DAYS = 90

interface GalleryState {
  galerias: GaleriaEnsaio[]
  createGallery: (appointmentId: string) => GaleriaEnsaio | null
  deleteGallery: (galleryId: string) => void
  addMedia: (galleryId: string, midia: MidiaGaleria) => void
  addEditedMedia: (galleryId: string, midia: MidiaGaleria) => void
  removeMedia: (galleryId: string, midiaId: string) => void
  publishSelection: (galleryId: string, days?: number) => string | null
  reopenSelection: (galleryId: string, days?: number) => boolean
  submitSelection: (
    token: string,
    fotoIds: string[],
    videoIds: string[],
  ) => SelecaoGaleria | null
  confirmExtras: (
    galleryId: string,
    formaPagamento: FormaPagamentoSaldo,
    confirmadoPor?: string,
  ) => void
  waiveExtras: (galleryId: string) => void
  releaseEditing: (galleryId: string, motivo: string) => void
  startEditing: (galleryId: string) => boolean
  markReadyForDelivery: (galleryId: string) => boolean
  publishDelivery: (galleryId: string, days?: number) => string | null
  revokeDelivery: (galleryId: string) => void
  registerDownload: (token: string, quantidade?: number) => void
  cancelGallery: (galleryId: string) => void
  restoreDemoData: () => void
}

function event(tipo: EventoGaleriaTipo, detalhe?: string): EventoGaleria {
  return { id: createId('gev'), tipo, em: new Date().toISOString(), detalhe }
}

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

function normalizeGallery(galeria: GaleriaEnsaio): GaleriaEnsaio {
  return {
    ...galeria,
    midias: galeria.midias ?? [],
    historico: galeria.historico ?? [],
  }
}

function findGallery(galerias: GaleriaEnsaio[], id: string): GaleriaEnsaio | undefined {
  return galerias.find((galeria) => galeria.id === id)
}

function findGalleryByToken(
  galerias: GaleriaEnsaio[],
  token: string,
): GaleriaEnsaio | undefined {
  return galerias.find(
    (galeria) =>
      galeria.tokenSelecao === token || galeria.entrega?.token === token,
  )
}

function updateGallery(
  galerias: GaleriaEnsaio[],
  id: string,
  updater: (galeria: GaleriaEnsaio) => GaleriaEnsaio,
): GaleriaEnsaio[] {
  return galerias.map((galeria) =>
    galeria.id === id
      ? { ...updater(galeria), updatedAt: new Date().toISOString() }
      : galeria,
  )
}

function getAppointmentForGallery(galeria: GaleriaEnsaio) {
  return useAppointmentStore
    .getState()
    .appointments.find((appointment) => appointment.id === galeria.agendamentoId)
}

function getPackageForGallery(galeria: GaleriaEnsaio) {
  const appointment = getAppointmentForGallery(galeria)
  if (!appointment) return undefined
  return usePackageStore
    .getState()
    .pacotes.find((pacote) => pacote.id === appointment.pacoteId)
}

function getConditionsForGallery(galeria: GaleriaEnsaio) {
  return getCondicoesGaleria(
    getAppointmentForGallery(galeria),
    getPackageForGallery(galeria),
  )
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (setState, getState) => ({
      galerias: createGallerySeedData(),

      createGallery: (appointmentId) => {
        const existing = getState().galerias.find(
          (galeria) => galeria.agendamentoId === appointmentId,
        )
        if (existing) return existing

        const appointment = useAppointmentStore
          .getState()
          .appointments.find((item) => item.id === appointmentId)
        if (!appointment) return null

        const timestamp = new Date().toISOString()
        const galeria: GaleriaEnsaio = {
          id: createId('gal'),
          agendamentoId: appointmentId,
          contratoId: appointment.contratoId,
          status: 'aguardando_upload',
          midias: [],
          historico: [
            event('criada', 'Galeria criada para o ensaio.'),
          ],
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        setState((state) => ({
          galerias: [...state.galerias, galeria],
        }))
        useAppointmentStore
          .getState()
          .linkGallery(appointmentId, galeria.id)

        return galeria
      },

      deleteGallery: (galleryId) => {
        setState((state) => ({
          galerias: state.galerias.filter((galeria) => galeria.id !== galleryId),
        }))
      },

      addMedia: (galleryId, midia) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            status:
              galeria.status === 'nao_criada'
                ? 'aguardando_upload'
                : galeria.status,
            midias: [...galeria.midias, midia],
            historico: [
              ...galeria.historico,
              event('midia_enviada', `${midia.nomeArquivo} enviada.`),
            ],
          })),
        }))
      },

      addEditedMedia: (galleryId, midia) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            midias: [
              ...galeria.midias,
              { ...midia, status: 'editada' as const },
            ],
            historico: [
              ...galeria.historico,
              event('midia_enviada', `Arquivo editado ${midia.nomeArquivo} enviado.`),
            ],
          })),
        }))
      },

      removeMedia: (galleryId, midiaId) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => {
            const midia = galeria.midias.find((item) => item.id === midiaId)
            return {
              ...galeria,
              midias: galeria.midias.filter((item) => item.id !== midiaId),
              historico: [
                ...galeria.historico,
                event(
                  'midia_removida',
                  midia ? `${midia.nomeArquivo} removida.` : 'Mídia removida.',
                ),
              ],
            }
          }),
        }))
      },

      publishSelection: (galleryId, days = SELECTION_DAYS) => {
        const galeria = findGallery(getState().galerias, galleryId)
        if (!galeria) return null

        const token = galeria.tokenSelecao ?? createId('sel')
        const prazo = addDaysIso(days)

        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (item) => ({
            ...item,
            status: 'em_selecao',
            tokenSelecao: token,
            prazoSelecaoEm: prazo,
            historico: [
              ...item.historico,
              event(
                'selecao_publicada',
                `Link de seleção publicado por ${days} dias.`,
              ),
            ],
          })),
        }))

        return token
      },

      reopenSelection: (galleryId, days = SELECTION_DAYS) => {
        const galeria = findGallery(getState().galerias, galleryId)
        if (!galeria || !galeria.tokenSelecao) return false
        if (!['em_selecao', 'selecao_enviada'].includes(galeria.status)) {
          return false
        }
        if (galeria.pedidoExtras?.status === 'pago') return false

        const prazo = addDaysIso(days)

        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (item) => ({
            ...item,
            status: 'em_selecao',
            prazoSelecaoEm: prazo,
            selecao: item.selecao
              ? { ...item.selecao, status: 'rascunho' }
              : undefined,
            pedidoExtras:
              item.pedidoExtras?.status === 'pendente'
                ? { ...item.pedidoExtras, status: 'cancelado' }
                : item.pedidoExtras,
            historico: [
              ...item.historico,
              event(
                'selecao_reaberta',
                `Link existente reaberto por ${days} dias.`,
              ),
            ],
          })),
        }))

        return true
      },

      submitSelection: (token, fotoIds, videoIds) => {
        const galeria = getState().galerias.find(
          (item) => item.tokenSelecao === token,
        )
        if (!galeria) return null
        if (galeria.status !== 'em_selecao') return null
        if (selecaoExpirada(galeria)) return null

        const condicoes = getConditionsForGallery(galeria)
        const validacao = validarSelecao(fotoIds, videoIds, condicoes)
        if (!validacao.ok) return null

        const pedidoExtras: PedidoExtras | undefined =
          validacao.resultado.fotosExtras > 0
            ? {
                id: createId('ext'),
                quantidadeFotos: validacao.resultado.fotosExtras,
                valorUnitario: condicoes.valorFotoExtra,
                valorTotal: validacao.resultado.valorExtras,
                status: 'pendente',
              }
            : undefined

        const selecao: SelecaoGaleria = {
          status: 'enviada',
          fotoIds,
          videoIds,
          fotosExtras: validacao.resultado.fotosExtras,
          valorExtras: validacao.resultado.valorExtras,
          enviadaEm: new Date().toISOString(),
        }

        setState((state) => ({
          galerias: updateGallery(state.galerias, galeria.id, (item) => ({
            ...item,
            status: 'selecao_enviada',
            selecao,
            pedidoExtras,
            historico: [
              ...item.historico,
              event(
                'selecao_enviada',
                pedidoExtras
                  ? `Seleção enviada com ${pedidoExtras.quantidadeFotos} foto(s) extra(s).`
                  : 'Seleção enviada pelo cliente.',
              ),
            ],
          })),
        }))

        return selecao
      },

      confirmExtras: (galleryId, formaPagamento, confirmadoPor) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            status: 'em_edicao',
            pedidoExtras: galeria.pedidoExtras
              ? {
                  ...galeria.pedidoExtras,
                  status: 'pago',
                  formaPagamento,
                  confirmadoEm: new Date().toISOString(),
                  confirmadoPor: confirmadoPor ?? 'Equipe do estúdio',
                }
              : undefined,
            historico: [
              ...galeria.historico,
              event(
                'extras_confirmados',
                `Extras confirmados via ${formaPagamento}.`,
              ),
              event('edicao_iniciada', 'Edição liberada após pagamento dos extras.'),
            ],
          })),
        }))
      },

      waiveExtras: (galleryId) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            status: 'em_edicao',
            pedidoExtras: galeria.pedidoExtras
              ? { ...galeria.pedidoExtras, status: 'isento' }
              : undefined,
            historico: [
              ...galeria.historico,
              event('extras_isentos', 'Extras marcados como isentos.'),
              event('edicao_iniciada', 'Edição liberada.'),
            ],
          })),
        }))
      },

      releaseEditing: (galleryId, motivo) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            status: 'em_edicao',
            pedidoExtras: galeria.pedidoExtras
              ? {
                  ...galeria.pedidoExtras,
                  liberacaoManual: {
                    por: 'Equipe do estúdio',
                    em: new Date().toISOString(),
                    motivo,
                  },
                }
              : galeria.pedidoExtras,
            historico: [
              ...galeria.historico,
              event('edicao_liberada', `Edição liberada manualmente: ${motivo}`),
              event('edicao_iniciada', 'Edição iniciada.'),
            ],
          })),
        }))
      },

      startEditing: (galleryId) => {
        const galeria = findGallery(getState().galerias, galleryId)
        if (!galeria || galeria.status !== 'selecao_enviada') return false
        if (
          galeria.pedidoExtras &&
          !['pago', 'isento'].includes(galeria.pedidoExtras.status) &&
          !galeria.pedidoExtras.liberacaoManual
        ) {
          return false
        }

        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (item) => ({
            ...item,
            status: 'em_edicao',
            historico: [
              ...item.historico,
              event('edicao_iniciada', 'Edição iniciada pelo estúdio.'),
            ],
          })),
        }))
        return true
      },

      markReadyForDelivery: (galleryId) => {
        const galeria = findGallery(getState().galerias, galleryId)
        if (!galeria || galeria.status !== 'em_edicao') return false
        if (!galeria.midias.some((midia) => midia.status === 'editada')) return false

        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (item) => ({
            ...item,
            status: 'pronta_entrega',
            historico: [
              ...item.historico,
              event('pronta_entrega', 'Arquivos editados prontos para entrega.'),
            ],
          })),
        }))
        return true
      },

      publishDelivery: (galleryId, days = DELIVERY_DAYS) => {
        const galeria = findGallery(getState().galerias, galleryId)
        if (!galeria) return null
        if (!['pronta_entrega', 'entregue'].includes(galeria.status)) return null
        if (
          galeria.pedidoExtras &&
          !['pago', 'isento'].includes(galeria.pedidoExtras.status)
        ) {
          return null
        }

        const token = galeria.entrega?.token ?? createId('ent')
        const publicadaEm = new Date().toISOString()

        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (item) => ({
            ...item,
            status: 'entregue',
            entrega: {
              token,
              status: 'disponivel',
              publicadaEm,
              expiraEm: addDaysIso(days),
              primeiroDownloadEm: item.entrega?.primeiroDownloadEm,
              quantidadeDownloads: item.entrega?.quantidadeDownloads ?? 0,
              downloads: item.entrega?.downloads ?? [],
            },
            historico: [
              ...item.historico,
              event(
                'entrega_publicada',
                `Link de entrega publicado por ${days} dias.`,
              ),
            ],
          })),
        }))

        return token
      },

      revokeDelivery: (galleryId) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            entrega: galeria.entrega
              ? { ...galeria.entrega, status: 'revogada' }
              : galeria.entrega,
            historico: [
              ...galeria.historico,
              event('entrega_revogada', 'Link de entrega revogado.'),
            ],
          })),
        }))
      },

      registerDownload: (token, quantidade = 1) => {
        const galeria = getState().galerias.find(
          (item) => item.entrega?.token === token,
        )
        if (!galeria?.entrega || galeria.entrega.status !== 'disponivel') return

        const agora = new Date().toISOString()

        setState((state) => ({
          galerias: updateGallery(state.galerias, galeria.id, (item) => ({
            ...item,
            entrega: item.entrega
              ? {
                  ...item.entrega,
                  primeiroDownloadEm:
                    item.entrega.primeiroDownloadEm ?? agora,
                  quantidadeDownloads:
                    item.entrega.quantidadeDownloads + quantidade,
                  downloads: [
                    ...item.entrega.downloads,
                    { em: agora, quantidade },
                  ],
                }
              : item.entrega,
            historico: [
              ...item.historico,
              event('download_registrado', `${quantidade} arquivo(s) baixado(s).`),
            ],
          })),
        }))
      },

      cancelGallery: (galleryId) => {
        setState((state) => ({
          galerias: updateGallery(state.galerias, galleryId, (galeria) => ({
            ...galeria,
            status: 'cancelada',
            historico: [
              ...galeria.historico,
              event('cancelada', 'Galeria cancelada pelo estúdio.'),
            ],
          })),
        }))
      },

      restoreDemoData: () => {
        setState({ galerias: createGallerySeedData() })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { galerias?: GaleriaEnsaio[] } | undefined
        return {
          galerias: (state?.galerias ?? []).map(normalizeGallery),
        }
      },
      partialize: (state) => ({ galerias: state.galerias }),
    },
  ),
)

export function findGalleryBySelectionToken(token: string): GaleriaEnsaio | undefined {
  return findGalleryByToken(useGalleryStore.getState().galerias, token)
}

export function findGalleryByDeliveryToken(token: string): GaleriaEnsaio | undefined {
  return useGalleryStore
    .getState()
    .galerias.find((galeria) => galeria.entrega?.token === token)
}

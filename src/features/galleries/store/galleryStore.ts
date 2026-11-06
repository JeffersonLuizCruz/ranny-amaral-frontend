import { create } from 'zustand'

import type { GaleriaEnsaio, MidiaGaleria } from '@/domain/galleries'
import type { Pagina } from '@/shared/api/types'
import { mensagemDeErro } from '@/shared/api/errors'
import {
  atualizarGaleriaNaLista,
  buscarGaleria,
  confirmarExtras,
  criarGaleria,
  iniciarEdicao,
  isentarExtras,
  liberarEdicao,
  liberarRaw,
  listarGalerias,
  listarMidias,
  marcarProntaEntrega,
  publicarEntrega,
  publicarSelecao,
  reabrirSelecao,
  removerMidia,
  revogarEntrega,
  revogarRaw,
  type GaleriaDetalhe,
  type GaleriasFiltros,
} from '@/features/galleries/api/galeriasApi'
import { enviarMidia, enviarVersaoEditada, removerVersaoEditada } from '@/features/galleries/api/galeriaUploadApi'
import type { UploadOptions } from '@/shared/upload/types'

interface GalleryState {
  galerias: GaleriaEnsaio[]
  paginaGalerias: Pagina<GaleriaEnsaio> | null
  galeriaAtual: GaleriaDetalhe | null
  midias: MidiaGaleria[]
  carregando: boolean
  carregandoDetalhe: boolean
  erro: string | null
  carregarGalerias: (filtros?: GaleriasFiltros) => Promise<void>
  carregarGaleria: (id: string) => Promise<GaleriaDetalhe | null>
  carregarMidias: (id: string) => Promise<void>
  createGallery: (appointmentId: string) => Promise<GaleriaEnsaio>
  uploadMidia: (
    id: string,
    file: File,
    tipo: 'foto' | 'video',
    options?: UploadOptions,
  ) => Promise<MidiaGaleria>
  uploadVersaoEditada: (
    id: string,
    midiaId: string,
    file: File,
    options?: UploadOptions,
  ) => Promise<MidiaGaleria>
  removeVersaoEditada: (id: string, midiaId: string) => Promise<void>
  removeMedia: (id: string, midiaId: string) => Promise<void>
  publishSelection: (id: string) => Promise<string>
  reopenSelection: (id: string) => Promise<string>
  confirmExtras: (id: string, forma: 'pix' | 'dinheiro') => Promise<void>
  waiveExtras: (id: string) => Promise<void>
  releaseEditing: (id: string, motivo: string) => Promise<void>
  startEditing: (id: string) => Promise<void>
  markReadyForDelivery: (id: string) => Promise<void>
  publishDelivery: (id: string) => Promise<string>
  revokeDelivery: (id: string) => Promise<void>
  releaseRaw: (id: string, por?: string) => Promise<void>
  revokeRaw: (id: string) => Promise<void>
  restoreDemoData: () => Promise<void>
}

function ordenar(galerias: GaleriaEnsaio[]): GaleriaEnsaio[] {
  return [...galerias].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export const useGalleryStore = create<GalleryState>()((set, get) => ({
  galerias: [],
  paginaGalerias: null,
  galeriaAtual: null,
  midias: [],
  carregando: false,
  carregandoDetalhe: false,
  erro: null,

  carregarGalerias: async (filtros = {}) => {
    set({ carregando: true, erro: null })
    try {
      const paginaGalerias = await listarGalerias(filtros)
      set({ galerias: ordenar(paginaGalerias.itens), paginaGalerias })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    } finally {
      set({ carregando: false })
    }
  },

  carregarGaleria: async (id) => {
    set({ carregandoDetalhe: true, erro: null })
    try {
      const detalhe = await buscarGaleria(id)
      const paginaMidias = await listarMidias(id, 0, 500)
      set({
        galeriaAtual: detalhe,
        midias: paginaMidias.itens,
        galerias: atualizarGaleriaNaLista(get().galerias, detalhe.galeria),
      })
      return detalhe
    } catch (error) {
      set({ erro: mensagemDeErro(error), galeriaAtual: null, midias: [] })
      throw error
    } finally {
      set({ carregandoDetalhe: false })
    }
  },

  carregarMidias: async (id) => {
    try {
      const pagina = await listarMidias(id, 0, 500)
      set({ midias: pagina.itens })
    } catch (error) {
      set({ erro: mensagemDeErro(error) })
      throw error
    }
  },

  createGallery: async (appointmentId) => {
    const criada = await criarGaleria(appointmentId)
    set((state) => ({ galerias: ordenar([...state.galerias, criada]), erro: null }))
    return criada
  },

  uploadMidia: async (id, file, tipo, options) => {
    const midia = await enviarMidia(id, file, tipo, options)
    set((state) => ({ midias: [...state.midias, midia] }))
    return midia
  },

  uploadVersaoEditada: async (id, midiaId, file, options) => {
    const midia = await enviarVersaoEditada(id, midiaId, file, options)
    set((state) => ({
      midias: state.midias.map((item) => (item.id === midia.id ? midia : item)),
    }))
    await get().carregarGaleria(id)
    return midia
  },

  removeVersaoEditada: async (id, midiaId) => {
    await removerVersaoEditada(id, midiaId)
    await get().carregarGaleria(id)
  },

  removeMedia: async (id, midiaId) => {
    await removerMidia(id, midiaId)
    set((state) => ({ midias: state.midias.filter((item) => item.id !== midiaId) }))
  },

  publishSelection: async (id) => {
    const link = await publicarSelecao(id)
    await get().carregarGaleria(id)
    return link.token
  },

  reopenSelection: async (id) => {
    const link = await reabrirSelecao(id)
    await get().carregarGaleria(id)
    return link.token
  },

  confirmExtras: async (id, forma) => {
    await confirmarExtras(id, forma)
    await get().carregarGaleria(id)
  },

  waiveExtras: async (id) => {
    await isentarExtras(id)
    await get().carregarGaleria(id)
  },

  releaseEditing: async (id, motivo) => {
    await liberarEdicao(id, motivo)
    await get().carregarGaleria(id)
  },

  startEditing: async (id) => {
    await iniciarEdicao(id)
    await get().carregarGaleria(id)
  },

  markReadyForDelivery: async (id) => {
    await marcarProntaEntrega(id)
    await get().carregarGaleria(id)
  },

  publishDelivery: async (id) => {
    const link = await publicarEntrega(id)
    await get().carregarGaleria(id)
    return link.token
  },

  revokeDelivery: async (id) => {
    await revogarEntrega(id)
    await get().carregarGaleria(id)
  },

  releaseRaw: async (id, por) => {
    await liberarRaw(id, por)
    await get().carregarGaleria(id)
  },

  revokeRaw: async (id) => {
    await revogarRaw(id)
    await get().carregarGaleria(id)
  },

  restoreDemoData: async () => {
    await get().carregarGalerias()
  },
}))

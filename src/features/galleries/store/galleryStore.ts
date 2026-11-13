import { create } from 'zustand'

import type { GaleriaEnsaio, MidiaFinalidade, MidiaGaleria } from '@/domain/galleries'
import type { Pagina } from '@/shared/api/types'
import { mensagemDeErro } from '@/shared/api/errors'
import {
  alterarFinalidade as alterarFinalidadeApi,
  atualizarGaleriaNaLista,
  buscarGaleria,
  confirmarExtras,
  criarGaleria,
  definirAutoLiberacao as definirAutoLiberacaoApi,
  isentarExtras,
  liberarEdicao,
  liberarLote as liberarLoteApi,
  liberarProntas as liberarProntasApi,
  liberarRaw,
  listarGalerias,
  listarMidias,
  publicarEntrega,
  publicarSelecao,
  reabrirSelecao,
  removerMidia,
  renovarLink as renovarLinkApi,
  revogarEntrega,
  revogarLiberacao as revogarLiberacaoApi,
  revogarRaw,
  type GaleriaDetalhe,
  type GaleriasFiltros,
  type LiberarLoteResultado,
} from '@/features/galleries/api/galeriasApi'
import { enviarMidia, enviarVersaoEditada, removerVersaoEditada } from '@/features/galleries/api/galeriaUploadApi'
import type {
  UploadEditadaLoteItem,
  UploadEditadaLoteProgresso,
  UploadEditadaLoteResultado,
} from '@/features/galleries/lib/editedBatch'
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
    finalidade?: MidiaFinalidade,
    options?: UploadOptions,
  ) => Promise<MidiaGaleria>
  uploadVersaoEditada: (
    id: string,
    midiaId: string,
    file: File,
    options?: UploadOptions,
    liberarAutomaticamente?: boolean,
  ) => Promise<MidiaGaleria>
  uploadVersoesEditadas: (
    id: string,
    itens: UploadEditadaLoteItem[],
    onProgress?: (midiaId: string, progresso: UploadEditadaLoteProgresso) => void,
    liberarAutomaticamente?: boolean,
  ) => Promise<UploadEditadaLoteResultado[]>
  removeVersaoEditada: (id: string, midiaId: string) => Promise<void>
  removeMedia: (id: string, midiaId: string) => Promise<void>
  publishSelection: (id: string) => Promise<string>
  reopenSelection: (id: string) => Promise<string>
  confirmExtras: (id: string, forma: 'pix' | 'dinheiro') => Promise<void>
  waiveExtras: (id: string) => Promise<void>
  releaseEditing: (id: string, motivo: string) => Promise<void>
  publishDelivery: (id: string) => Promise<string>
  revokeDelivery: (id: string) => Promise<void>
  releaseRaw: (id: string, por?: string) => Promise<void>
  revokeRaw: (id: string) => Promise<void>
  liberarLote: (id: string, midiaIds: string[]) => Promise<LiberarLoteResultado>
  liberarProntas: (id: string) => Promise<LiberarLoteResultado>
  revogarLiberacao: (id: string, midiaIds: string[]) => Promise<LiberarLoteResultado>
  renovarLink: (id: string) => Promise<string>
  definirAutoLiberacao: (id: string, midiaId: string, value: boolean) => Promise<void>
  alterarFinalidade: (
    id: string,
    midiaId: string,
    finalidade: MidiaFinalidade,
  ) => Promise<void>
  recarregar: () => Promise<void>
}

function ordenar(galerias: GaleriaEnsaio[]): GaleriaEnsaio[] {
  return [...galerias].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

const TAMANHO_PAGINA_MIDIAS = 100

/**
 * Carrega todas as páginas de mídias.
 *
 * O backend limita cada página a 100 itens; pedir 500 diretamente retorna
 * `400 PAGINACAO_INVALIDA` e derruba a tela de detalhe.
 */
async function listarTodasMidias(id: string): Promise<MidiaGaleria[]> {
  const primeira = await listarMidias(id, 0, TAMANHO_PAGINA_MIDIAS)
  const midias = [...primeira.itens]

  for (let pagina = 1; pagina < primeira.totalPaginas; pagina += 1) {
    const proxima = await listarMidias(id, pagina, TAMANHO_PAGINA_MIDIAS)
    midias.push(...proxima.itens)
  }

  return midias
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
      const midias = await listarTodasMidias(id)
      set({
        galeriaAtual: detalhe,
        midias,
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
      const midias = await listarTodasMidias(id)
      set({ midias })
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

  uploadMidia: async (id, file, tipo, finalidade = 'edicao', options) => {
    const midia = await enviarMidia(id, file, tipo, finalidade, options)
    set((state) => ({ midias: [...state.midias, midia] }))
    return midia
  },

  uploadVersaoEditada: async (id, midiaId, file, options, liberarAutomaticamente = true) => {
    const midia = await enviarVersaoEditada(
      id,
      midiaId,
      file,
      options,
      liberarAutomaticamente,
    )
    set((state) => ({
      midias: state.midias.map((item) => (item.id === midia.id ? midia : item)),
    }))
    await get().carregarGaleria(id)
    return midia
  },

  uploadVersoesEditadas: async (id, itens, onProgress, liberarAutomaticamente = true) => {
    const resultados: UploadEditadaLoteResultado[] = Array.from(
      { length: itens.length },
      (_, indice) => ({
        midiaId: itens[indice].midiaId,
        ok: false,
        erro: 'Envio não concluído.',
      }),
    )
    let proximo = 0

    const trabalhador = async () => {
      while (true) {
        const indice = proximo
        proximo += 1
        if (indice >= itens.length) return

        const item = itens[indice]
        onProgress?.(item.midiaId, { status: 'enviando', percentual: 0 })
        try {
          const midia = await enviarVersaoEditada(
            id,
            item.midiaId,
            item.file,
            {
              onProgress: (progresso) =>
                onProgress?.(item.midiaId, {
                  status: 'enviando',
                  percentual: progresso.percentual,
                }),
            },
            liberarAutomaticamente,
          )
          onProgress?.(item.midiaId, { status: 'concluido', percentual: 100 })
          set((state) => ({
            midias: state.midias.map((atual) =>
              atual.id === midia.id ? midia : atual,
            ),
          }))
          resultados[indice] = { midiaId: item.midiaId, ok: true }
        } catch (error) {
          const erro = mensagemDeErro(error)
          onProgress?.(item.midiaId, { status: 'erro', percentual: 0, erro })
          resultados[indice] = { midiaId: item.midiaId, ok: false, erro }
        }
      }
    }

    // Tres uploads simultaneos equilibram velocidade e carga no storage.
    const concorrencia = Math.min(3, itens.length)
    await Promise.all(Array.from({ length: concorrencia }, () => trabalhador()))
    // A recarga e apenas visual; uma falha aqui nao invalida os uploads.
    await get().carregarGaleria(id).catch(() => undefined)
    return resultados
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

  liberarLote: async (id, midiaIds) => {
    const resultado = await liberarLoteApi(id, midiaIds)
    await get().carregarGaleria(id)
    return resultado
  },

  liberarProntas: async (id) => {
    const resultado = await liberarProntasApi(id)
    await get().carregarGaleria(id)
    return resultado
  },

  revogarLiberacao: async (id, midiaIds) => {
    const resultado = await revogarLiberacaoApi(id, midiaIds)
    await get().carregarGaleria(id)
    return resultado
  },

  renovarLink: async (id) => {
    const link = await renovarLinkApi(id)
    await get().carregarGaleria(id)
    return link.token
  },

  definirAutoLiberacao: async (id, midiaId, value) => {
    await definirAutoLiberacaoApi(id, midiaId, value)
    await get().carregarGaleria(id)
  },

  alterarFinalidade: async (id, midiaId, finalidade) => {
    const midia = await alterarFinalidadeApi(id, midiaId, finalidade)
    set((state) => ({
      midias: state.midias.map((item) => (item.id === midia.id ? midia : item)),
    }))
    await get().carregarGaleria(id)
  },

  recarregar: async () => {
    await get().carregarGalerias()
  },
}))

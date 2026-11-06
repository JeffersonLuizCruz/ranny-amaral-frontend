import { useCallback, useEffect, useState } from 'react'

import type { SolicitacaoAceite } from '@/domain/contracts'
import { listarLinks } from '@/features/contracts/api/contratosApi'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'

/** Carrega os links de aceite de um contrato direto da API. */
export function useLinksAceite(contratoId: string) {
  const [links, setLinks] = useState<SolicitacaoAceite[]>([])
  const [carregando, setCarregando] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      setLinks(await listarLinks(contratoId))
    } catch (error) {
      addToast(mensagemDeErro(error))
    } finally {
      setCarregando(false)
    }
  }, [addToast, contratoId])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  return { links, carregando, recarregar }
}

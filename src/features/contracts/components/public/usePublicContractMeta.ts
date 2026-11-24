import { useEffect } from 'react'

/**
 * Bloqueia indexação e vazamento de referrer da capability URL do contrato.
 *
 * O token é a credencial de acesso; por isso a regra vale para todos os estados
 * da página (loading, erro, pendente e aceite).
 */
export function usePublicContractMeta() {
  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow, noarchive'
    const referrer = document.createElement('meta')
    referrer.name = 'referrer'
    referrer.content = 'no-referrer'
    document.head.append(robots, referrer)

    return () => {
      robots.remove()
      referrer.remove()
    }
  }, [])
}

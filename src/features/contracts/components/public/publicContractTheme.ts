/**
 * Estilos compartilhados da superfície pública do contrato.
 *
 * O tema é isolado da aplicação interna (azul) para manter a mesma linguagem
 * visual da proposta pública do /crm: cartões claros, acento ciano e CTA
 * laranja/rosa.
 */
export const publicCard =
  'rounded-3xl bg-white/95 shadow-sm ring-1 ring-cyan-100 backdrop-blur'

export const publicDisplay = 'public-contract-display'

export const publicInputClass =
  'h-11 w-full rounded-xl border border-cyan-100 bg-white px-3.5 text-base text-cyan-950 outline-none transition placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:text-sm'

export const publicSelectClass =
  'h-11 w-full appearance-none rounded-xl border border-cyan-100 bg-white px-3.5 text-base text-cyan-950 outline-none transition hover:border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:text-sm'

export const publicLabelClass = 'block text-xs font-semibold text-cyan-950'

export const publicCtaClass =
  'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-0 bg-gradient-to-r from-orange-400 to-rose-400 text-base font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:from-orange-500 hover:to-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60'

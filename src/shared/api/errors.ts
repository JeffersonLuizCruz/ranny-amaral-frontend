/** Extrai uma mensagem amigável de qualquer erro (ApiError, Error ou valor). */
export function mensagemDeErro(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível concluir a operação.'
}

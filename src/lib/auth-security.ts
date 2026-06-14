export const MIN_PASSWORD_LENGTH = 6;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export function friendlyAuthError(error: { message: string }, fallback: string): string {
  const message = error.message.toLowerCase();
  if (message.includes("invalid api key")) {
    return "A configuração de autenticação está desatualizada. Reinicie o servidor e tente novamente.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Não foi possível concluir agora. Verifique os dados e tente novamente mais tarde.";
  }
  if (message.includes("password")) {
    return "A senha não atende aos requisitos de segurança.";
  }
  return fallback;
}

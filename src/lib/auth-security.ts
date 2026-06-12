export const MIN_PASSWORD_LENGTH = 10;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Use letras maiúsculas, minúsculas e números na senha.";
  }
  return null;
}

export function friendlyAuthError(error: { message: string }, fallback: string): string {
  const message = error.message.toLowerCase();
  if (message.includes("invalid api key")) {
    return "A configuração de autenticação está desatualizada. Reinicie o servidor e tente novamente.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
  }
  if (message.includes("password")) {
    return "A senha não atende aos requisitos de segurança.";
  }
  return fallback;
}

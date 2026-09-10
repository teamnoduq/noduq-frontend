const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  invalid_login_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma el correo antes de entrar. Revisa la bandeja.",
  user_already_registered: "Ese correo ya tiene cuenta. Entra o usa otro.",
  over_email_send_rate_limit: "Demasiados intentos. Espera un momento.",
  signup_disabled: "El registro está cerrado en Supabase.",
  weak_password: "La contraseña es demasiado débil. Prueba con una más larga.",
};

export function supabaseAuthMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "No se pudo completar. Inténtalo de nuevo.";
  const code = (error.code ?? "").toLowerCase().replaceAll("-", "_");
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("invalid login") || message.includes("invalid_credentials")) {
    return AUTH_MESSAGES.invalid_credentials;
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return AUTH_MESSAGES.user_already_registered;
  }
  if (message.includes("email not confirmed")) {
    return AUTH_MESSAGES.email_not_confirmed;
  }
  if (message.includes("password") && message.includes("6")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  return error.message || "No se pudo completar. Inténtalo de nuevo.";
}

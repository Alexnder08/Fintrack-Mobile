const mensajes: Record<string, string> = {
  email_address_invalid:
    "Supabase rechazó este correo como inválido. Usa un correo real al que tengas acceso.",
  invalid_credentials:
    "El correo o la contraseña no son correctos. Si aún no tienes una cuenta, créala primero.",
  email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
  user_already_exists: "Este correo ya tiene una cuenta. Inicia sesión.",
  email_exists: "Este correo ya tiene una cuenta. Inicia sesión.",
  weak_password: "Elige una contraseña más segura, de al menos 8 caracteres.",
  email_address_not_authorized:
    "El servicio de correo aún no permite enviar confirmaciones a esta dirección. Contacta al administrador de Fintrack.",
  over_email_send_rate_limit:
    "Se alcanzó el límite de correos de confirmación. Espera unos minutos antes de intentarlo nuevamente.",
  over_request_rate_limit:
    "Demasiados intentos. Espera unos minutos antes de volver a ingresar.",
  signup_disabled: "El registro de cuentas no está disponible en este momento.",
  email_provider_disabled:
    "El acceso con correo no está disponible en este momento.",
};

export function mensajeErrorAcceso(fallo: unknown): string {
  if (typeof fallo === "object" && fallo !== null) {
    const error = fallo as { code?: string; status?: number; name?: string };
    if (error.code && mensajes[error.code]) return mensajes[error.code];
    if (error.status === 429) return mensajes.over_request_rate_limit;
    if (error.status && error.status >= 500)
      return "El servicio de acceso no está disponible temporalmente. Inténtalo más tarde.";
    if (error.name === "AuthRetryableFetchError" || error.name === "TypeError")
      return "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo nuevamente.";
  }
  return "No pudimos completar el acceso. Inténtalo nuevamente; si el problema continúa, contacta al administrador de Fintrack.";
}

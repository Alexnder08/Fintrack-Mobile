import { describe, expect, it } from "@jest/globals";
import { mensajeErrorAcceso } from "./erroresAcceso";

describe("errores de acceso", () => {
  it("explica el rechazo del correo sin culpar a la conexión", () => {
    expect(
      mensajeErrorAcceso({ code: "email_address_invalid", status: 400 }),
    ).toContain("Usa un correo real");
  });
  it.each([
    ["invalid_credentials", "créala primero"],
    ["email_not_confirmed", "Confirma tu correo"],
    ["email_address_not_authorized", "servicio de correo"],
    ["over_email_send_rate_limit", "límite de correos"],
    ["weak_password", "contraseña más segura"],
  ])("explica %s", (code, texto) => {
    expect(mensajeErrorAcceso({ code })).toContain(texto);
  });
  it("distingue saturación, fallo del servidor y falta de conexión", () => {
    expect(mensajeErrorAcceso({ status: 429 })).toContain(
      "Demasiados intentos",
    );
    expect(mensajeErrorAcceso({ status: 503 })).toContain("temporalmente");
    expect(mensajeErrorAcceso({ name: "AuthRetryableFetchError" })).toContain(
      "Revisa tu conexión",
    );
  });
  it("no expone detalles internos de errores inesperados", () => {
    expect(mensajeErrorAcceso(new Error("detalle privado"))).not.toContain(
      "detalle privado",
    );
    expect(mensajeErrorAcceso(null)).toContain("contacta al administrador");
  });
});

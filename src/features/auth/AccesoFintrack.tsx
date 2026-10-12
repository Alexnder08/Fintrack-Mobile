import { useRef, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Screen, StateView, Text, TextField } from "../../components";
import { useSesion } from "../../hooks/useSesion";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { spacing } from "../../theme";
import { mensajeErrorAcceso } from "./erroresAcceso";

export function AccesoFintrack({ children }: { children: ReactNode }) {
  const {
    local,
    sesion,
    cargando,
    entrarDemo,
    entrarPersonal,
    error: errorSesion,
  } = useSesion();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [registro, setRegistro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const ocupado = useRef(false);

  async function enviar() {
    if (ocupado.current) return;
    setError(null);
    setAviso(null);
    if (!isSupabaseConfigured) {
      setError(
        "El acceso con cuenta aún no está configurado. Puedes usar Fintrack en este dispositivo.",
      );
      return;
    }
    const email = correo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Escribe un correo válido.");
      return;
    }
    if (contrasena.length < (registro ? 8 : 1)) {
      setError(
        registro
          ? "Usa una contraseña de al menos 8 caracteres."
          : "Escribe tu contraseña.",
      );
      return;
    }
    ocupado.current = true;
    setEnviando(true);
    try {
      const resultado = registro
        ? await supabase.auth.signUp({ email, password: contrasena })
        : await supabase.auth.signInWithPassword({
            email,
            password: contrasena,
          });
      if (resultado.error) {
        setError(mensajeErrorAcceso(resultado.error));
        return;
      }
      setContrasena("");
      if (registro && !resultado.data.session)
        setAviso(
          "Revisa tu correo y confirma tu cuenta. Después podrás iniciar sesión.",
        );
    } catch (fallo) {
      setError(mensajeErrorAcceso(fallo));
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  if (cargando)
    return (
      <Screen>
        <StateView
          kind="loading"
          title="Recuperando tu sesión"
          description="Un momento, por favor."
        />
      </Screen>
    );
  if (local || sesion) return children;
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Screen scrollable contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text role="heading">Fintrack</Text>
          <Text tone="secondary">
            Tus cuentas, tus movimientos y una visión clara de tu dinero.
          </Text>
        </View>
        <Text role="title">
          {registro ? "Crea tu cuenta" : "Inicia sesión"}
        </Text>
        <TextField
          label="Correo electrónico"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          editable={!enviando}
        />
        <TextField
          label="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={registro ? "new-password" : "current-password"}
          editable={!enviando}
          onSubmitEditing={() => void enviar()}
        />
        {error || errorSesion ? (
          <Text accessibilityRole="alert" tone="negative">
            {error ?? errorSesion}
          </Text>
        ) : null}
        {aviso ? (
          <Text accessibilityLiveRegion="polite" tone="positive">
            {aviso}
          </Text>
        ) : null}
        <Button
          label={registro ? "Crear cuenta" : "Entrar"}
          fullWidth
          loading={enviando}
          onPress={() => void enviar()}
        />
        <Button
          label="Explorar demostración"
          variant="tonal"
          fullWidth
          disabled={enviando}
          onPress={() => {
            void entrarDemo().catch(() =>
              setError("No pudimos abrir la demostración."),
            );
          }}
        />
        <Button
          label="Usar en este dispositivo"
          variant="tonal"
          fullWidth
          disabled={enviando}
          onPress={() => {
            void entrarPersonal().catch(() =>
              setError(
                "No pudimos guardar el acceso. Revisa el espacio disponible.",
              ),
            );
          }}
        />
        <Text role="caption" tone="secondary">
          Tus datos se guardan aquí. Puedes exportarlos desde tu perfil; no se
          sincronizan con otros dispositivos.
        </Text>
        <Button
          label={registro ? "Ya tengo una cuenta" : "Crear una cuenta nueva"}
          variant="text"
          fullWidth
          disabled={enviando}
          onPress={() => {
            setRegistro((actual) => !actual);
            setError(null);
            setAviso(null);
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    justifyContent: "center",
    gap: spacing.md,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  heading: { gap: spacing.sm, marginBottom: spacing.xl },
});

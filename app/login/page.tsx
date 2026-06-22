"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import PastlerLogo from "@/components/PastlerLogo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("E-Mail oder Passwort ist falsch");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Bitte bestätige zuerst deine E-Mail-Adresse");
      } else {
        setError("Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);

    if (resetError) {
      setError("Zurücksetzen fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }

    setInfo("E-Mail gesendet — prüfe deinen Posteingang");
  }

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center bg-login-hero px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-login-pattern" />

      <div className="relative z-10 w-full max-w-md rounded-[4px] border border-white/15 bg-white shadow-[0_24px_48px_rgba(13,24,40,0.35)]">
        <div className="p-8">
          <div className="mb-8 text-center">
            <PastlerLogo variant="light" showWordmark className="mx-auto" />
            <p className="mt-4 text-sm font-medium text-text-secondary">
              Internes Dashboard
            </p>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="E-Mail"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@beispiel.de"
              />

              <div>
                <Input
                  label="Passwort"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("reset");
                  }}
                  className="mt-2 text-xs font-medium text-navy underline-offset-2 transition-colors hover:text-gold hover:underline"
                >
                  Passwort vergessen?
                </button>
              </div>

              {error && (
                <p
                  className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-2.5 font-medium"
              >
                {loading ? "Anmelden…" : "Anmelden"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-text-secondary">
                Gib deine E-Mail-Adresse ein, um einen Reset-Link anzufordern.
              </p>
              <Input
                label="E-Mail"
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@beispiel.de"
              />

              {error && (
                <p
                  className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {info && (
                <p
                  className="rounded-[4px] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                  role="status"
                >
                  {info}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading || Boolean(info)}
                className="w-full py-2.5 font-medium"
              >
                {loading ? "Senden…" : "Reset-Link senden"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode("login");
                }}
                className="w-full text-center text-xs font-medium text-navy underline-offset-2 transition-colors hover:text-gold hover:underline"
              >
                Zurück zur Anmeldung
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import PastlerLogo from "@/components/PastlerLogo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
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
    <div className="relative flex min-h-full flex-1 items-center justify-center bg-login-hero px-4">
      <div className="pointer-events-none absolute inset-0 bg-login-pattern" />
      <Card className="relative z-10 w-full max-w-md border-white/10 bg-navy shadow-card">
        <CardBody className="p-8">
          <div className="mb-8 text-center">
            <PastlerLogo variant="dark" showWordmark className="mx-auto" />
            <p className="mt-4 text-sm text-white/60">Internes Dashboard</p>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="E-Mail"
                id="email"
                type="email"
                variant="dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div>
                <Input
                  label="Passwort"
                  id="password"
                  type="password"
                  variant="dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("reset");
                  }}
                  className="mt-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Passwort vergessen?
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-300" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="gold"
                disabled={loading}
                className="w-full py-2.5"
              >
                {loading ? "Anmelden…" : "Anmelden"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-white/60">
                Gib deine E-Mail-Adresse ein, um einen Reset-Link anzufordern.
              </p>
              <Input
                label="E-Mail"
                id="reset-email"
                type="email"
                variant="dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {error && (
                <p className="text-sm text-red-300" role="alert">
                  {error}
                </p>
              )}
              {info && (
                <p className="text-sm text-green-300" role="status">
                  {info}
                </p>
              )}

              <Button
                type="submit"
                variant="gold"
                disabled={loading || Boolean(info)}
                className="w-full py-2.5"
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
                className="w-full text-center text-xs text-white/40 transition-colors hover:text-white/70"
              >
                Zurück zur Anmeldung
              </button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

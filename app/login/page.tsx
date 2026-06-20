"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Ungültige Anmeldedaten");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy-deep px-4">
      <div className="w-full max-w-md border border-white/10 bg-navy p-8 rounded-[4px]">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl tracking-[3px] text-white">
            PASTLER<span className="text-gold">.</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">Internes Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-[10px] uppercase tracking-wider text-white/40"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-white/12 bg-white/7 px-3 py-2 text-sm text-white rounded-[4px] outline-none focus:border-gold"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-[10px] uppercase tracking-wider text-white/40"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-white/12 bg-white/7 px-3 py-2 text-sm text-white rounded-[4px] outline-none focus:border-gold"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold py-2.5 text-sm font-medium text-navy rounded-[2px] transition-colors hover:bg-gold-light disabled:opacity-60"
          >
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}

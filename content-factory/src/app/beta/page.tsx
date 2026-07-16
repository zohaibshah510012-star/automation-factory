"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, MailIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function BetaInvitePage() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite_code") ?? params.get("code") ?? "";
    const invitedEmail = params.get("email") ?? "";
    setInviteCode(code.toUpperCase());
    setEmail(invitedEmail);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const verifyResponse = await fetch("/api/beta/invites/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, invite_code: inviteCode }),
    });

    if (!verifyResponse.ok) {
      setLoading(false);
      setMessage("Invalid or expired Beta invite.");
      return;
    }

    window.localStorage.setItem("automation_factory_beta_invite_code", inviteCode);
    const client = getSupabaseBrowserClient();
    const { error } = await client?.auth.signInWithOtp({
      email,
      options: {
        data: { invite_code: inviteCode },
        emailRedirectTo: `${window.location.origin}/dashboard?invite_code=${encodeURIComponent(inviteCode)}`,
      },
    }) ?? { error: new Error("Supabase auth is not configured.") };

    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Open it to finish Beta access.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_32%),linear-gradient(180deg,#050712_0%,#0f172a_100%)] px-6 py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Link className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase text-white/80" href="/">
          <span className="grid size-9 place-items-center rounded-2xl bg-white text-slate-950"><SparklesIcon /></span>
          Automation Factory
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-center">
          <div>
            <p className="text-sm text-cyan-200">Private Beta</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
              Join the first creator cohort.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Use your invite code to access the AI short drama production workspace, create your first asset, and send product feedback directly to the team.
            </p>
          </div>

          <Card className="border-white/10 bg-white/[0.08] text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
            <CardHeader>
              <MailIcon />
              <CardTitle>Activate invite</CardTitle>
              <CardDescription className="text-white/60">The invite must match the email selected by the admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={submit}>
                <Input className="bg-white text-slate-950" onChange={(event) => setEmail(event.target.value)} placeholder="creator@example.com" required type="email" value={email} />
                <Input className="bg-white text-slate-950" onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="BETA-XXXX" required value={inviteCode} />
                <Button className="bg-white text-slate-950 hover:bg-cyan-100" disabled={loading} type="submit">
                  Send magic link
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                {message ? <p className="text-sm text-white/70">{message}</p> : null}
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

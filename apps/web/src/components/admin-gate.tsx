"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, TextInput, Window } from "@formos/ui";
import { trpc } from "@/lib/trpc/react";
import { getAdminToken, setAdminToken } from "@/lib/admin";
import { StatePanel } from "@/components/state-panel";

/**
 * Gates the admin-only areas (dashboard, editor, analytics) behind the shared
 * passcode. It probes a protected procedure (form.list); if the server replies
 * UNAUTHORIZED, it shows the passcode screen. Public form pages are NOT wrapped.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const [ready, setReady] = useState(false);
  const [hadToken, setHadToken] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setHadToken(!!getAdminToken());
    setReady(true);
  }, []);

  const probe = trpc.form.list.useQuery(undefined, { retry: false, enabled: ready });

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const token = value.trim();
    if (!token) return;
    setSubmitting(true);
    setAdminToken(token);
    setHadToken(true);
    await utils.invalidate();
    setSubmitting(false);
  }

  if (!ready || probe.isLoading || probe.isFetching) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 420, width: "100%" }}>
          <Window title="FormOS" accent="teal" controls={false}>
            <StatePanel variant="loading" title="Checking access…" />
          </Window>
        </div>
      </main>
    );
  }

  const unauthorized =
    probe.isError && probe.error?.data?.code === "UNAUTHORIZED";

  if (unauthorized) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 440, width: "100%" }}>
          <Window title="🔒 Admin access" accent="blue">
            <p className="muted" style={{ marginBottom: 12 }}>
              The FormOS builder and analytics are passcode-protected. Enter the
              admin passcode to continue. (Public form links don&rsquo;t need this.)
            </p>
            <form onSubmit={unlock}>
              <TextInput
                type="password"
                placeholder="Admin passcode"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <Button type="submit" variant="primary" disabled={submitting || !value.trim()}>
                  {submitting ? "Unlocking…" : "Unlock"}
                </Button>
                {hadToken && (
                  <span className="field__error" style={{ fontSize: 12 }}>
                    Incorrect passcode — try again.
                  </span>
                )}
              </div>
            </form>
          </Window>
        </div>
      </main>
    );
  }

  if (probe.isError) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 460, width: "100%" }}>
          <Window title="Error" accent="magenta">
            <StatePanel variant="error" title="Couldn't reach the server">
              {probe.error?.message}
            </StatePanel>
          </Window>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

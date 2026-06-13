"use client";

import { Button, Window } from "@formos/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="center-screen">
      <div style={{ maxWidth: 480, width: "100%" }}>
        <Window title="System Error" accent="magenta">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }} aria-hidden>
              💥
            </div>
            <h2 style={{ marginTop: 8 }}>Something went sideways</h2>
            <p className="muted" style={{ margin: "8px 0 18px" }}>
              {error.message || "An unexpected error occurred."}
            </p>
            <Button variant="primary" onClick={() => reset()}>
              Try again
            </Button>
          </div>
        </Window>
      </div>
    </div>
  );
}

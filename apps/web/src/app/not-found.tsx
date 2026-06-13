import Link from "next/link";
import { Window } from "@formos/ui";

export default function NotFound() {
  return (
    <div className="center-screen">
      <div style={{ maxWidth: 460, width: "100%" }}>
        <Window title="Error" accent="magenta">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }} aria-hidden>
              🛑
            </div>
            <h2 style={{ marginTop: 8 }}>404 — Not found</h2>
            <p className="muted" style={{ margin: "8px 0 18px" }}>
              This window doesn&rsquo;t exist, or it was closed.
            </p>
            <Link href="/" className="btn btn--primary">
              Back to Dashboard
            </Link>
          </div>
        </Window>
      </div>
    </div>
  );
}

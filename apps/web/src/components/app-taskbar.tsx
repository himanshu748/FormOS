"use client";

import Link from "next/link";
import { Taskbar } from "@formos/ui";

export function AppTaskbar() {
  const start = (
    <Link href="/" className="btn start-btn">
      <span aria-hidden>▣</span> FormOS
    </Link>
  );

  return (
    <Taskbar start={start}>
      <Link href="/" className="btn hide-sm">
        Dashboard
      </Link>
      <a
        href="/docs"
        className="btn hide-sm"
        target="_blank"
        rel="noreferrer noopener"
      >
        API Docs
      </a>
    </Taskbar>
  );
}

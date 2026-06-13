"use client";

import { useEffect, useState } from "react";

function format(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Clock() {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    setTime(format(new Date()));
    const id = setInterval(() => setTime(format(new Date())), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="taskbar__clock statusbar__cell" suppressHydrationWarning>
      {time}
    </span>
  );
}

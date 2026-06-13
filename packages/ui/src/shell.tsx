import type { ReactNode } from "react";
import { cn } from "./cn";
import { Clock } from "./clock";

export function Toolbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("toolbar bevel-out", className)}>{children}</div>;
}

export function ToolbarSpacer() {
  return <span className="toolbar__spacer" />;
}

export function StatusBar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("statusbar", className)}>{children}</div>;
}

export function StatusCell({ children }: { children: ReactNode }) {
  return <span className="statusbar__cell">{children}</span>;
}

export function Taskbar({
  start,
  children,
}: {
  start?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <nav className="taskbar" aria-label="Taskbar">
      {start}
      <span className="taskbar__items">{children}</span>
      <Clock />
    </nav>
  );
}

export function DesktopIcon({
  icon,
  label,
  onOpen,
}: {
  icon: ReactNode;
  label: ReactNode;
  onOpen?: () => void;
}) {
  return (
    <button type="button" className="desktop-icon" onClick={onOpen}>
      <span className="desktop-icon__glyph">{icon}</span>
      <span className="desktop-icon__label">{label}</span>
    </button>
  );
}

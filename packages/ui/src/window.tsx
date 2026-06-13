import type { ReactNode } from "react";
import { cn } from "./cn";

export type WindowAccent = "teal" | "purple" | "blue" | "magenta" | "green";

export interface WindowProps {
  title?: ReactNode;
  icon?: ReactNode;
  accent?: WindowAccent;
  /** Show decorative minimize/maximize/close buttons in the title bar. */
  controls?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  className?: string;
  bodyClassName?: string;
  /** Optional content rendered in the title bar, right of the title. */
  titleExtra?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Window({
  title,
  icon,
  accent,
  controls = true,
  onClose,
  onMinimize,
  className,
  bodyClassName,
  titleExtra,
  footer,
  children,
}: WindowProps) {
  return (
    <section className={cn("win", className)} data-accent={accent}>
      {title !== undefined && (
        <div className="win__titlebar">
          {icon && <span className="win__icon">{icon}</span>}
          <span className="win__title">{title}</span>
          <span className="win__spacer" />
          {titleExtra}
          {controls && (
            <span className="win__controls">
              <button
                type="button"
                className="titlebtn"
                aria-label="Minimize"
                onClick={onMinimize}
              >
                _
              </button>
              <button type="button" className="titlebtn" aria-label="Maximize">
                □
              </button>
              <button
                type="button"
                className="titlebtn"
                aria-label="Close"
                onClick={onClose}
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
      <div className={cn("win__body", bodyClassName)}>{children}</div>
      {footer && <div className="win__footer">{footer}</div>}
    </section>
  );
}

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("field", className)}>
      {label !== undefined && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="field__req" title="Required" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {hint && <span className="field__hint">{hint}</span>}
      {children}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn("input", className)} {...rest} />;
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn("textarea", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn("select", className)} {...rest}>
        {children}
      </select>
    );
  },
);

export interface ChoiceProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  block?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox(
  { label, block, className, ...rest },
  ref,
) {
  return (
    <label className={cn("choice", block && "choice--block", className)}>
      <input ref={ref} type="checkbox" {...rest} />
      {label !== undefined && <span className="choice__label">{label}</span>}
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(function Radio(
  { label, block, className, ...rest },
  ref,
) {
  return (
    <label className={cn("choice", block && "choice--block", className)}>
      <input ref={ref} type="radio" {...rest} />
      {label !== undefined && <span className="choice__label">{label}</span>}
    </label>
  );
});

export function GroupBox({
  legend,
  className,
  children,
}: {
  legend?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn("groupbox", className)}>
      {legend !== undefined && <legend className="groupbox__legend">{legend}</legend>}
      {children}
    </fieldset>
  );
}

"use client";

import {
  ButtonHTMLAttributes,
  cloneElement,
  InputHTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

type ButtonVariant = "primary" | "ghost" | "danger" | "quiet";

export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        error: Boolean(error),
        describedBy,
      })
    : children;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="field-optional">opcional</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  error,
  describedBy,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  describedBy?: string;
}) {
  return (
    <input
      className="input"
      {...props}
      aria-invalid={error || undefined}
      aria-describedby={describedBy}
    />
  );
}

export function ModeSwitch({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Cuenta o empleado">
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? "is-on" : undefined}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PasswordInput({
  id,
  error,
  describedBy,
  revealLabel = "Mostrar contraseña",
  hideLabel = "Ocultar contraseña",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: boolean;
  describedBy?: string;
  revealLabel?: string;
  hideLabel?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        id={id}
        className="input"
        type={visible ? "text" : "password"}
        {...props}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? hideLabel : revealLabel}
      >
        {visible ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
      </button>
    </div>
  );
}

export function Banner({
  tone = "error",
  children,
}: {
  tone?: "error" | "ok" | "info";
  children: ReactNode;
}) {
  return (
    <div className={`banner banner-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  danger?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={danger ? "modal modal-danger" : "modal"}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-sheet">
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-busy">
      <span className="spinner" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

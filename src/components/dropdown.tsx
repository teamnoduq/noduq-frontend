"use client";

import {
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";

export type DropdownOption = { id: string; label: string };

export function Dropdown({
  label,
  valueLabel,
  options,
  value,
  onChange,
  ariaLabel,
  align = "left",
  rise = false,
  fit = false,
  groups,
}: {
  label?: string;
  valueLabel: string;
  options?: DropdownOption[];
  groups?: { heading?: string; options: DropdownOption[] }[];
  value?: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  align?: "left" | "right";
  rise?: boolean;
  fit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const items = groups?.flatMap((group) => group.options) ?? options ?? [];

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`drop ${align === "right" ? "is-right" : ""} ${rise ? "is-rise" : ""} ${fit ? "is-fit" : ""}`} ref={root}>
      {label ? <span className="drop-label">{label}</span> : null}
      <button
        type="button"
        className="drop-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((next) => !next)}
      >
        <span>{valueLabel}</span>
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
      {open ? (
        <ul id={listId} className="drop-menu" role="listbox" aria-label={ariaLabel}>
          {(groups ?? [{ options: items }]).map((group, index) => (
            <li key={group.heading ?? index} className="drop-group" role="presentation">
              {group.heading ? <p className="drop-heading">{group.heading}</p> : null}
              {group.options.map((option) => {
                const on = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={on ? "is-on" : undefined}
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MenuPopover({
  ariaLabel,
  trigger,
  triggerClassName = "icon-btn",
  rise = false,
  align = "right",
  block = false,
  portal = false,
  children,
}: {
  ariaLabel: string;
  trigger: ReactNode;
  triggerClassName?: string;
  rise?: boolean;
  align?: "left" | "right";
  block?: boolean;
  portal?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [spot, setSpot] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (root.current?.contains(target)) return;
      if (portal && (target as HTMLElement).closest?.(".drop-menu.is-fixed")) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, portal]);

  useEffect(() => {
    if (!open || !portal) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = 168;
      const openUp = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
      const width = 196;
      const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
      setSpot({
        top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, portal]);

  const menu = (
    <div
      className={`drop-menu drop-actions${portal ? " is-fixed" : ""}`}
      role="menu"
      style={portal && spot ? { top: spot.top, left: spot.left } : undefined}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  );

  return (
    <div
      className={`drop ${align === "right" ? "is-right" : ""} ${rise ? "is-rise" : ""} ${block ? "is-block" : ""}`}
      ref={root}
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((next) => !next)}
      >
        {trigger}
      </button>
      {open ? (portal ? createPortal(menu, document.body) : menu) : null}
    </div>
  );
}

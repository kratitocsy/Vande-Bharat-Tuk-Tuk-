"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { PinIcon } from "./Icons";
import { PLACES, placePoint, type Point } from "@/lib/places";

export type Choice =
  | { type: "place"; point: Point }
  | { type: "suggestion"; name: string; address: string; eLoc: string }
  | { type: "myloc" };

type Suggestion = { name: string; address: string; eLoc: string };

export type PlaceInputHandle = { focus: () => void };

type Props = {
  id: string;
  label: string;
  placeholder: string;
  marker: "pickup" | "dropoff";
  point: Point | null;
  excludeSlug?: string; // the other field's place, so it is not offered twice
  allowMyLocation?: boolean;
  onFocusField: () => void; // also fires when typing starts, so the map can wake up
  onClear: () => void;
  onChoose: (choice: Choice) => void;
  trailing?: React.ReactNode; // e.g. the swap button
};

const POPULAR = ["khajuraho-town", "western-temples", "eastern-temples", "airport", "railway-station", "bus-stand"];

export const PlaceInput = forwardRef<PlaceInputHandle, Props>(function PlaceInput(
  { id, label, placeholder, marker, point, excludeSlug, allowMyLocation, onFocusField, onClear, onChoose, trailing },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(point?.name ?? "");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [remote, setRemote] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);
  const [index, setIndex] = useState(-1);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // Show what was chosen (from the list, the map or a swap) in the box.
  useEffect(() => {
    if (!focused) setText(point?.name ?? "");
  }, [point, focused]);

  const query = text.trim().toLowerCase();

  const local = useMemo(() => {
    const base = PLACES.filter((p) => p.slug !== excludeSlug);
    const list = query
      ? base.filter((p) => p.name.toLowerCase().includes(query) || p.slug.replace(/-/g, " ").includes(query))
      : POPULAR.map((s) => base.find((p) => p.slug === s)).filter((p): p is (typeof base)[number] => Boolean(p));
    return list.slice(0, query ? 5 : 6);
  }, [query, excludeSlug]);

  // Place suggestions from the map service once at least 3 letters are typed.
  useEffect(() => {
    setAsked(false);
    if (!focused || query.length < 3 || (point && point.name.toLowerCase() === query)) {
      setRemote([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/places?q=${encodeURIComponent(text.trim())}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          setRemote(Array.isArray(data?.suggestions) ? data.suggestions : []);
          setAsked(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [text, query, focused, point]);

  // Skip map results that repeat a place we already list.
  const remoteShown = remote.filter((s) => !local.some((p) => p.name.toLowerCase().startsWith(s.name.toLowerCase())));

  const rows: { key: string; choice: Choice; title: string; sub?: string; tag?: string }[] = [];
  if (allowMyLocation && !query) rows.push({ key: "myloc", choice: { type: "myloc" }, title: "Use my current location", tag: "GPS" });
  local.forEach((p) => rows.push({ key: `p-${p.slug}`, choice: { type: "place", point: placePoint(p.slug)! }, title: p.name, sub: p.group }));
  remoteShown.forEach((s) => rows.push({ key: `s-${s.eLoc}`, choice: { type: "suggestion", ...s }, title: s.name, sub: s.address, tag: "Map" }));

  function select(row: (typeof rows)[number]) {
    setOpen(false);
    setIndex(-1);
    onChoose(row.choice);
    if (row.choice.type === "place") setText(row.choice.point.name);
    if (row.choice.type === "suggestion") setText(row.choice.name);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setIndex((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && open && rows.length) {
      e.preventDefault();
      select(rows[index >= 0 ? index : 0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dot =
    marker === "pickup" ? (
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full border-[3px] border-ink" />
    ) : (
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[3px] border-sun" />
    );

  return (
    <div className="relative">
      <div className={`flex min-h-16 items-center gap-3.5 bg-[#fffefa] px-4 pb-2.5 pt-3 pr-4 transition focus-within:bg-[#fffbea] ${marker === "pickup" ? "rounded-t-[17px]" : "rounded-b-[17px] border-t border-line"}`}>
        {dot}
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="label block">
            {label}
          </label>
          <input
            id={id}
            ref={inputRef}
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            onFocus={() => {
              setFocused(true);
              setOpen(true);
              onFocusField();
              inputRef.current?.select();
            }}
            onBlur={() => {
              setFocused(false);
              window.setTimeout(() => setOpen(false), 150); // let a tap on a row land first
            }}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              setIndex(-1);
              onFocusField();
              if (point && e.target.value !== point.name) onClear();
            }}
            onKeyDown={onKeyDown}
            className="mt-0.5 w-full truncate bg-transparent text-[0.97rem] font-medium outline-none placeholder:font-normal placeholder:text-[#8f9993]"
          />
        </div>
        {loading && <span aria-hidden className="text-xs text-muted">…</span>}
        {trailing}
      </div>

      {open && focused && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+4px)] z-40 max-h-[340px] overflow-auto rounded-2xl border border-line bg-paper py-1.5 shadow-2xl"
        >
          {rows.map((row, i) => (
            <li key={row.key} role="option" aria-selected={i === index}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(row)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-green-soft ${i === index ? "bg-green-soft" : ""}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-green">
                  <PinIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[0.9rem]">{row.title}</strong>
                  {row.sub && <span className="block truncate text-[0.74rem] text-muted">{row.sub}</span>}
                </span>
                {row.tag && <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted">{row.tag}</span>}
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-4 py-3 text-[0.84rem] text-muted">{asked ? "No match yet. Tap the map to drop a pin." : "Keep typing…"}</li>
          )}
          <li className="border-t border-line px-4 pb-1.5 pt-2 text-[0.72rem] text-muted">You can also tap the map to drop a pin.</li>
        </ul>
      )}
    </div>
  );
});

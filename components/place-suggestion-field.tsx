"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { suggestReportingPlaces, type PlaceSuggestion } from "@/lib/place-suggestions";

const COPY = {
  en: {
    placeholder: "Search a road, area, or city",
    suggestions: "Suggested places",
    empty: "No matching place. You can still enter this road manually.",
  },
  hi: {
    placeholder: "सड़क, क्षेत्र या शहर खोजें",
    suggestions: "सुझाए गए स्थान",
    empty: "कोई मिलता स्थान नहीं। आप सड़क का नाम स्वयं लिख सकते हैं।",
  },
} as const;

type PlaceSuggestionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceSuggestion | null) => void;
  required?: boolean;
  maxLength?: number;
};

export function PlaceSuggestionField({ id, value, onChange, onPlaceSelect, required, maxLength = 120 }: PlaceSuggestionFieldProps) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const generatedId = useId().replaceAll(":", "");
  const listboxId = `${id}-${generatedId}-suggestions`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(() => suggestReportingPlaces(value), [value]);

  function choose(place: PlaceSuggestion) {
    onChange(place.value[locale]);
    onPlaceSelect?.(place);
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(suggestions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 z-10 text-muted-foreground" size={17} />
      <input
        id={id}
        className="field pl-10 pr-10"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && suggestions[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
        autoComplete="off"
        maxLength={maxLength}
        value={value}
        placeholder={copy.placeholder}
        required={required}
        onFocus={() => { setOpen(true); setActiveIndex(0); }}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onChange={(event) => { onChange(event.target.value); onPlaceSelect?.(null); setOpen(true); setActiveIndex(0); }}
      />
      <Search aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" size={17} />

      {open ? (
        <div id={listboxId} role="listbox" aria-label={copy.suggestions} className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-editorial">{copy.suggestions}</p>
          {suggestions.length > 0 ? suggestions.map((place, index) => (
            <button
              key={place.id}
              id={`${listboxId}-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              tabIndex={-1}
              className={`flex min-h-14 w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-100 ${activeIndex === index ? "bg-secondary" : "hover:bg-muted"}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(place)}
            >
              <Navigation aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={16} />
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{place.primary[locale]}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{place.secondary[locale]}</span></span>
            </button>
          )) : (
            <p className="px-3 py-4 text-sm leading-6 text-muted-foreground">{copy.empty}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Building2, Map, MapPin, Navigation, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { suggestReportingPlaces, type PlaceKind, type PlaceSuggestion } from "@/lib/place-suggestions";

const COPY = {
  en: {
    placeholder: "Search a road, city, or state",
    suggestions: "Matching places",
    featured: "Across India",
    empty: "No matching place. Add the road, city, and state manually.",
    kind: { road: "Road", area: "Area", city: "City", state: "State / UT" },
  },
  hi: {
    placeholder: "सड़क, शहर या राज्य खोजें",
    suggestions: "मिलते हुए स्थान",
    featured: "पूरे भारत में",
    empty: "कोई मिलता स्थान नहीं। सड़क, शहर और राज्य स्वयं लिखें।",
    kind: { road: "सड़क", area: "क्षेत्र", city: "शहर", state: "राज्य / केंद्र शासित प्रदेश" },
  },
} as const;

const KIND_ICONS: Record<PlaceKind, typeof Navigation> = {
  road: Navigation,
  area: MapPin,
  city: Building2,
  state: Map,
};

type PlaceSuggestionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceSuggestion | null) => void;
  descriptionId?: string;
  required?: boolean;
  maxLength?: number;
};

export function PlaceSuggestionField({ id, value, onChange, onPlaceSelect, descriptionId, required, maxLength = 120 }: PlaceSuggestionFieldProps) {
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
      <div className="location-search-shell">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <MapPin aria-hidden="true" size={18} />
        </span>
        <input
          id={id}
          className="location-search-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-describedby={descriptionId}
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
        <Search aria-hidden="true" className="shrink-0 text-muted-foreground" size={19} />
      </div>

      {open ? (
        <div id={listboxId} role="listbox" aria-label={copy.suggestions} className="absolute top-full z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-editorial">{value.trim() ? copy.suggestions : copy.featured}</p>
          {suggestions.length > 0 ? suggestions.map((place, index) => {
            const Icon = KIND_ICONS[place.kind];
            return (
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
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Icon aria-hidden="true" size={16} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{place.primary[locale]}</span><span className="shrink-0 text-xs font-medium text-muted-foreground">{copy.kind[place.kind]}</span></span><span className="mt-1 block truncate text-xs text-muted-foreground">{place.secondary[locale]}</span></span>
              <span className="mt-1 shrink-0 rounded-full border border-border px-2 py-1 font-mono text-xs font-bold text-primary">{place.stateCode}</span>
            </button>
            );
          }) : (
            <p className="px-3 py-4 text-sm leading-6 text-muted-foreground">{copy.empty}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

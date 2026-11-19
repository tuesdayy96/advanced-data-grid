import { useEffect, useRef, useState } from "react";
import { createColumnFilter, filterOperators } from "../core/processing";
import type { ColumnFilter, FilterOperator } from "../types/grid";

const labels: Record<FilterOperator, string> = {
  contains: "Contains",
  equals: "Equals",
  startsWith: "Starts with",
  endsWith: "Ends with",
  notEquals: "Does not equal",
  gt: "Greater than",
  gte: "Greater than or equal to",
  lt: "Less than",
  lte: "Less than or equal to",
  before: "Before",
  after: "After",
};

export function FilterPanel({
  id,
  columnKey,
  header,
  kind,
  filter,
  onApply,
  onClose,
}: {
  id: string;
  columnKey: string;
  header: string;
  kind: ColumnFilter["kind"];
  filter?: ColumnFilter;
  onApply: (filter?: ColumnFilter) => void;
  onClose: () => void;
}) {
  const [operator, setOperator] = useState<FilterOperator>(
    filter?.operator ?? filterOperators[kind][0],
  );
  const [draft, setDraft] = useState(filter ? String(filter.value) : "");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function apply() {
    const next = createColumnFilter(columnKey, kind, operator, draft);
    if (next) onApply(next);
    else setError(true);
  }

  return (
    <section
      id={id}
      className="adg-filter-panel"
      aria-label={`Filter ${header}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <strong>{header}</strong>
      <label>
        Condition
        <select
          value={operator}
          onChange={(event) => {
            const selected = Array.from<FilterOperator>(
              filterOperators[kind],
            ).find((value) => value === event.target.value);
            if (selected) setOperator(selected);
          }}
        >
          {filterOperators[kind].map((value) => (
            <option key={value} value={value}>
              {labels[value]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Value
        <input
          ref={input}
          type={kind === "date" ? "date" : "text"}
          inputMode={kind === "number" ? "decimal" : undefined}
          value={draft}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              apply();
            }
          }}
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
        />
      </label>
      <button type="button" onClick={apply}>
        Apply
      </button>
      <button type="button" onClick={() => onApply()}>
        Clear
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
      {error && (
        <span id={`${id}-error`} role="alert">
          Enter a valid {kind} filter value.
        </span>
      )}
    </section>
  );
}

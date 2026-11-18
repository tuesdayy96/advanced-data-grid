import { useEffect, useRef, type ComponentProps } from "react";
import type { EditorKind } from "../../core/editing";

export function CellEditor({
  kind,
  ...props
}: { kind: EditorKind } & Pick<
  ComponentProps<"input">,
  | "defaultValue"
  | "onChange"
  | "onBlur"
  | "onKeyDown"
  | "aria-label"
  | "aria-invalid"
  | "aria-describedby"
>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    if (kind === "text") inputRef.current?.select();
  }, [kind]);

  return (
    <input
      ref={inputRef}
      className="adg-editor"
      type={kind === "date" ? "date" : "text"}
      inputMode={kind === "number" ? "decimal" : undefined}
      autoComplete="off"
      {...props}
    />
  );
}

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  clampWidth,
  getColumnLayout,
  getWidthLimits,
  type LayoutColumn,
} from "../core/columnLayout";
import type { ColumnDef } from "../types/grid";

interface Resize {
  pointerId: number;
  handle: HTMLButtonElement;
  key: string;
  x: number;
  initial: number;
  width: number;
  limits: ReturnType<typeof getWidthLimits>;
  frame?: number;
}

function releaseResize(drag: Resize) {
  if (drag.frame !== undefined) cancelAnimationFrame(drag.frame);
  if (drag.handle.hasPointerCapture?.(drag.pointerId)) {
    drag.handle.releasePointerCapture(drag.pointerId);
  }
}

export function useColumnLayout<T>(
  columns: readonly ColumnDef<T>[],
  containerRef: RefObject<HTMLDivElement | null>,
  enableColumnResize: boolean,
  pinning: boolean,
  onColumnResize?: (key: string, width: number) => void,
) {
  const [viewport, setViewport] = useState<number>();
  const [widths, setWidths] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const [preview, setPreview] = useState<{ key: string; width: number }>();
  const resize = useRef<Resize | null>(null);
  const callback = useRef(onColumnResize);
  const hasPins = pinning && columns.some(({ pinned }) => pinned);

  useEffect(() => {
    callback.current = onColumnResize;
  }, [onColumnResize]);

  useEffect(() => {
    if (!hasPins || !containerRef.current) return;
    const container = containerRef.current;
    const measure = () => setViewport(container.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      container.ownerDocument.defaultView?.addEventListener("resize", measure);
      return () =>
        container.ownerDocument.defaultView?.removeEventListener(
          "resize",
          measure,
        );
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, hasPins]);

  useEffect(() => {
    setWidths((previous) => {
      const kept = Array.from(previous).filter(([key]) =>
        columns.some((column) => column.key === key),
      );
      return kept.length === previous.size ? previous : new Map(kept);
    });
    if (
      resize.current &&
      !columns.some(
        ({ key, resizable }) =>
          key === resize.current?.key && resizable !== false,
      )
    ) {
      releaseResize(resize.current);
      resize.current = null;
      setPreview(undefined);
    }
  }, [columns]);

  useEffect(() => {
    if (!enableColumnResize) {
      setPreview(undefined);
      return;
    }
    const win = containerRef.current?.ownerDocument.defaultView;
    if (!win) return;

    function onMove(event: globalThis.PointerEvent) {
      const drag = resize.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.width = clampWidth(
        Math.round(drag.initial + event.clientX - drag.x),
        drag.limits,
      );
      if (drag.frame !== undefined) return;
      drag.frame = requestAnimationFrame(() => {
        drag.frame = undefined;
        setPreview({ key: drag.key, width: drag.width });
      });
    }

    function stop() {
      const drag = resize.current;
      if (!drag) return;
      resize.current = null;
      releaseResize(drag);
      setPreview(undefined);
      return drag;
    }

    function onUp(event: globalThis.PointerEvent) {
      const current = resize.current;
      if (current?.pointerId !== event.pointerId) return;
      const drag = stop();
      if (drag && drag.width !== drag.initial) {
        setWidths((previous) => new Map(previous).set(drag.key, drag.width));
        callback.current?.(drag.key, drag.width);
      }
    }

    function onCancel(event: globalThis.PointerEvent) {
      if (resize.current?.pointerId === event.pointerId) stop();
    }

    win.addEventListener("pointermove", onMove);
    win.addEventListener("pointerup", onUp);
    win.addEventListener("pointercancel", onCancel);
    win.addEventListener("blur", stop);
    return () => {
      win.removeEventListener("pointermove", onMove);
      win.removeEventListener("pointerup", onUp);
      win.removeEventListener("pointercancel", onCancel);
      win.removeEventListener("blur", stop);
      if (resize.current) releaseResize(resize.current);
      resize.current = null;
    };
  }, [containerRef, enableColumnResize]);

  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    entry: LayoutColumn<T>,
  ) {
    if (event.button !== 0 || resize.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resize.current = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      key: entry.column.key,
      x: event.clientX,
      width: entry.width,
      initial: entry.width,
      limits: getWidthLimits(entry.column),
    };
  }

  function resizeBy(entry: LayoutColumn<T>, delta: number) {
    const width = clampWidth(entry.width + delta, getWidthLimits(entry.column));
    if (width === entry.width) return;
    setWidths((previous) => new Map(previous).set(entry.column.key, width));
    onColumnResize?.(entry.column.key, width);
  }

  const layout = useMemo(() => {
    const displayedWidths =
      enableColumnResize && preview
        ? new Map(widths).set(preview.key, preview.width)
        : widths;
    return getColumnLayout(columns, displayedWidths, hasPins, viewport);
  }, [columns, enableColumnResize, hasPins, preview, viewport, widths]);

  return {
    layout,
    startResize,
    resizeBy,
    resizing: enableColumnResize && !!preview,
  };
}

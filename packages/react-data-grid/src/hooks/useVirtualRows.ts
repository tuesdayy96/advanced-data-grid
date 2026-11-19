import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  getVirtualRange,
  HEADER_HEIGHT,
  OVERSCAN,
  ROW_HEIGHT,
} from "../core/virtualization";

const initialViewport = { viewportHeight: 0, scrollTop: 0 };

export function useVirtualRows(
  enabled: boolean,
  rowCount: number,
  height: number | string | undefined,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(initialViewport);
  const renderedViewport = useRef(initialViewport);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    let viewportHeight = 0;
    function update(scrollTop: number, fromScroll = false) {
      const previous = renderedViewport.current;
      const currentRange = getVirtualRange(
        rowCount,
        ROW_HEIGHT,
        previous.scrollTop,
        previous.viewportHeight,
        OVERSCAN,
      );
      const nextRange = getVirtualRange(
        rowCount,
        ROW_HEIGHT,
        scrollTop,
        viewportHeight,
        OVERSCAN,
      );

      if (
        currentRange.startIndex !== nextRange.startIndex ||
        currentRange.endIndex !== nextRange.endIndex
      ) {
        const next = { scrollTop, viewportHeight };
        renderedViewport.current = next;
        // A jump past the mounted rows must update before the viewport paints.
        const visible = getVirtualRange(
          rowCount,
          ROW_HEIGHT,
          scrollTop,
          viewportHeight,
          0,
        );
        if (
          fromScroll &&
          (visible.startIndex < currentRange.startIndex ||
            visible.endIndex > currentRange.endIndex)
        ) {
          flushSync(() => setViewport(next));
        } else {
          setViewport(next);
        }
      }
    }

    function onScroll() {
      if (container) update(container.scrollTop, true);
    }

    function measure() {
      if (!container) return;
      viewportHeight = Math.max(0, container.clientHeight - HEADER_HEIGHT);
      update(container.scrollTop);
    }

    measure();
    container.addEventListener("scroll", onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(container);
    if (!observer) window.addEventListener("resize", measure);

    return () => {
      container.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", measure);
    };
  }, [enabled, height, rowCount]);

  return {
    containerRef,
    range: getVirtualRange(
      rowCount,
      ROW_HEIGHT,
      viewport.scrollTop,
      viewport.viewportHeight,
      OVERSCAN,
    ),
  };
}

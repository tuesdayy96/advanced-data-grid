import { useEffect, useState, type RefObject } from "react";

interface Metrics {
  rendered: number;
  firstVisible: number;
  lastVisible: number;
  viewportHeight: number;
  rowHeight: number;
}

export function GridMetrics({
  demoRef,
  total,
}: {
  demoRef: RefObject<HTMLDivElement | null>;
  total: number;
}) {
  const [metrics, setMetrics] = useState<Metrics>();

  useEffect(() => {
    const table = demoRef.current?.querySelector("table");
    const scroller = table?.parentElement;
    if (!table || !scroller) return;

    function measure() {
      if (!table || !scroller) return;
      const rows = table.querySelectorAll<HTMLTableRowElement>(
        "tbody tr[aria-rowindex]",
      );
      const rowHeight = rows[0]?.getBoundingClientRect().height ?? 0;
      const viewportHeight = Math.max(
        0,
        scroller.clientHeight - (table.tHead?.offsetHeight ?? 0),
      );
      const next = {
        rendered: rows.length,
        firstVisible: rowHeight
          ? Math.floor(scroller.scrollTop / rowHeight) + 1
          : 0,
        lastVisible: rowHeight
          ? Math.min(
              total,
              Math.ceil((scroller.scrollTop + viewportHeight) / rowHeight),
            )
          : 0,
        viewportHeight,
        rowHeight,
      };
      setMetrics(next);
    }

    let frame = 0;
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    const mutations = new MutationObserver(schedule);
    mutations.observe(table, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-rowindex"],
    });
    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    scroller.addEventListener("scroll", schedule, { passive: true });
    schedule();

    return () => {
      mutations.disconnect();
      observer.disconnect();
      scroller.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [demoRef, total]);

  return (
    <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm tabular-nums">
      <div>
        <dt className="text-slate-600">Rendered rows</dt>
        <dd className="font-semibold">{metrics?.rendered ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-600">Visible rows</dt>
        <dd className="font-semibold">
          {metrics ? `${metrics.firstVisible}–${metrics.lastVisible}` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-slate-600">Data viewport</dt>
        <dd className="font-semibold">
          {metrics ? `${metrics.viewportHeight} px` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-slate-600">Row height</dt>
        <dd className="font-semibold">
          {metrics ? `${metrics.rowHeight} px` : "—"}
        </dd>
      </div>
    </dl>
  );
}

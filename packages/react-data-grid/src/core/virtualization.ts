export const ROW_HEIGHT = 40;
export const HEADER_HEIGHT = 44;
export const OVERSCAN = 5;

export function getVirtualRange(
  rowCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  overscan: number,
) {
  const totalHeight = rowCount * rowHeight;
  const viewport = Math.max(0, viewportHeight);
  const offset = Math.min(
    Math.max(0, scrollTop),
    Math.max(0, totalHeight - viewport),
  );
  const startIndex =
    viewport === 0 ? 0 : Math.max(0, Math.floor(offset / rowHeight) - overscan);
  const endIndex =
    viewport === 0
      ? 0
      : Math.min(
          rowCount,
          Math.ceil((offset + viewport) / rowHeight) + overscan,
        );

  return {
    startIndex,
    endIndex,
    topPadding: startIndex * rowHeight,
    bottomPadding: totalHeight - endIndex * rowHeight,
    totalHeight,
  };
}

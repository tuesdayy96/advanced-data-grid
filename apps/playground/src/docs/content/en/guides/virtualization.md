Use a bounded viewport such as `height={480}` or `height="60vh"`. The header stays at the top. The grid renders visible rows plus a small overscan above and below them. Spacer rows preserve the scroll range as rendered rows enter and leave the DOM.

Row height is fixed. There is no public variable-height, overscan, or column virtualization option. Rendering fewer nodes keeps scrolling work bounded by the viewport, but the input data and operations such as sorting still scale with dataset size. In Playground, choose **100,000 rows** and compare **Matching rows** to **Rendered rows** while scrolling.

See [height and rowKey](/docs/en/api/data-grid).

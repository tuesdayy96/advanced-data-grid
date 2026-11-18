import { describe, expect, it } from "vitest";
import {
  getEditor,
  parseEdit,
  sameValue,
} from "../packages/react-data-grid/src/core/editing";
import type { ColumnDef } from "../packages/react-data-grid/src";

const row = {
  salary: 1000,
  date: new Date("2025-01-02T13:14:15.678Z"),
  label: "2025-01-02",
};
const salary = {
  key: "salary",
  header: "Salary",
  width: 90,
  editable: true,
  accessor: (row) => row.salary.toLocaleString(),
  validate: (value) =>
    (typeof value === "number" && value >= -100) || "Too small.",
} satisfies ColumnDef<typeof row>;
const date = {
  key: "date",
  header: "Date",
  width: 100,
  editable: true,
} satisfies ColumnDef<typeof row>;
const label = {
  key: "label",
  header: "Label",
  width: 100,
  editable: true,
  editor: "date",
} satisfies ColumnDef<typeof row>;

describe("editing values", () => {
  it("uses the raw field instead of its formatted display value", () => {
    expect(getEditor(salary, row)).toEqual({
      kind: "number",
      original: 1000,
      initial: "1000",
    });
  });

  it.each(["", " ", "-", ".", "Infinity", "NaN", "1e400", "1,000", "0xff"])(
    "rejects incomplete or nonfinite number %j",
    (input) => {
      expect(parseEdit(input, "number", 1000, salary, row)).toEqual({
        error: "Enter a valid number.",
      });
    },
  );

  it("parses signed decimals and validates the parsed value", () => {
    expect(parseEdit("-.5", "number", 1000, salary, row)).toEqual({
      value: -0.5,
    });
    expect(parseEdit("1.", "number", 1000, salary, row)).toEqual({ value: 1 });
    expect(parseEdit("-200", "number", 1000, salary, row)).toEqual({
      error: "Too small.",
    });
  });

  it("validates calendar days and preserves dates, UTC time and date-only strings", () => {
    expect(getEditor(date, row)?.initial).toBe("2025-01-02");
    expect(parseEdit("2025-02-29", "date", row.date, date, row)).toHaveProperty(
      "error",
    );
    expect(parseEdit("2028-02-29", "date", row.date, date, row)).toEqual({
      value: new Date("2028-02-29T13:14:15.678Z"),
    });
    expect(parseEdit("2028-02-29", "date", row.label, label, row)).toEqual({
      value: "2028-02-29",
    });
    expect(sameValue(row.date, new Date(row.date))).toBe(true);
    expect(
      getEditor(label, { ...row, label: "2025-01-02T13:14:15Z" }),
    ).toBeNull();
  });

  it("requires an explicit getter and parser for computed columns", () => {
    const computed = {
      key: "double",
      header: "Double",
      width: 100,
      editable: true,
      accessor: (row) => row.salary * 2,
    } satisfies ColumnDef<typeof row>;
    expect(getEditor(computed, row)).toBeNull();
    const configured = {
      ...computed,
      valueGetter: (value: typeof row) => value.salary,
      valueParser: (draft: string) => {
        if (!draft.trim()) throw new Error("Required.");
        return Number(draft) / 2;
      },
    };
    expect(getEditor(configured, row)?.original).toBe(1000);
    expect(parseEdit("3000", "number", 1000, configured, row)).toEqual({
      value: 1500,
    });
    expect(parseEdit("", "number", 1000, configured, row)).toEqual({
      error: "Required.",
    });
  });
});

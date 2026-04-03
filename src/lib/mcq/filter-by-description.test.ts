import { describe, expect, it } from "vitest";
import { filterMcqsByDescription } from "./filter-by-description";

describe("filterMcqsByDescription", () => {
	const rows = [
		{ id: "1", title: "A", description: "Photosynthesis basics" },
		{ id: "2", title: "B", description: "Cell division overview" },
		{ id: "3", title: "C", description: "" },
	];

	it("returns all items when query is empty", () => {
		expect(filterMcqsByDescription(rows, "")).toEqual(rows);
		expect(filterMcqsByDescription(rows, "   ")).toEqual(rows);
	});

	it("filters by description substring case-insensitively", () => {
		expect(filterMcqsByDescription(rows, "photo")).toEqual([rows[0]]);
		expect(filterMcqsByDescription(rows, "CELL")).toEqual([rows[1]]);
		expect(filterMcqsByDescription(rows, "overview")).toEqual([rows[1]]);
	});

	it("returns empty array when no description matches", () => {
		expect(filterMcqsByDescription(rows, "quantum")).toEqual([]);
	});

	it("matches empty description only when query is empty", () => {
		expect(filterMcqsByDescription(rows, "anything").map((r) => r.id)).not.toContain("3");
	});
});

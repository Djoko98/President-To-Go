import { describe, expect, it } from "vitest";import{clampQuantity}from"@/lib/quantity";
describe("ograničenja količine",()=>{it("ne dozvoljava manje od jedan",()=>expect(clampQuantity(-2,10)).toBe(1));it("poštuje maksimum proizvoda",()=>expect(clampQuantity(25,10)).toBe(10));it("zadržava dozvoljenu količinu",()=>expect(clampQuantity(4,10)).toBe(4));});

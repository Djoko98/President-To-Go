import { describe, expect, it } from "vitest";
import { calculateCartTotal, calculateLineTotal, formatMoney } from "@/lib/money";
describe("obračun cena",()=>{it("računa stavku u najmanjoj valutnoj jedinici",()=>expect(calculateLineTotal(59000,2)).toBe(118000));it("sabira korpu",()=>expect(calculateCartTotal([{price:59000,quantity:2},{price:39000,quantity:1}])).toBe(157000));it("formatira dinare",()=>expect(formatMoney(59000)).toContain("590"));it("odbija neispravnu količinu",()=>expect(()=>calculateLineTotal(59000,0)).toThrow());});

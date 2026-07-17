import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_ORDER_STORAGE_KEY,
  clearActiveOrder,
  readActiveOrder,
  saveActiveOrder,
} from "@/lib/active-order";

const firstOrder = {
  token: "123e4567-e89b-42d3-a456-426614174000",
  orderNumber: "PTG-101",
};

describe("pamćenje aktivne porudžbine", () => {
  beforeEach(() => localStorage.clear());

  it("čuva i učitava bezbedan link porudžbine", () => {
    saveActiveOrder(firstOrder, localStorage);
    expect(readActiveOrder(localStorage)).toEqual(firstOrder);
  });

  it("ignoriše neispravan token", () => {
    localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify({ token: "pogresan", orderNumber: "1" }));
    expect(readActiveOrder(localStorage)).toBeNull();
  });

  it("stara kartica ne briše noviju aktivnu porudžbinu", () => {
    saveActiveOrder(firstOrder, localStorage);
    clearActiveOrder("123e4567-e89b-42d3-a456-426614174999", localStorage);
    expect(readActiveOrder(localStorage)).toEqual(firstOrder);
    clearActiveOrder(firstOrder.token, localStorage);
    expect(readActiveOrder(localStorage)).toBeNull();
  });
});

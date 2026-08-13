import { expect, test } from "@playwright/test";

test("početni katalog staje u vidljivi ekran bez skrolovanja", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".catalog-product-stage h1")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerHeight, page: document.documentElement.scrollHeight }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  const categoriesFit = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>("[aria-label='Kategorije']")?.getBoundingClientRect();
    const track = document.querySelector<HTMLElement>(".category-wheel")?.getBoundingClientRect();
    if (!nav || !track) return false;
    // Stavke van vidljivog dela točka nastavljaju niz kružnicu i odsečene su — merimo samo vidljive.
    const items = [...document.querySelectorAll<HTMLElement>("[aria-label='Kategorije'] .category-arc")]
      .map((item) => item.getBoundingClientRect())
      .filter((item) => item.right > track.left && item.left < track.right);
    return items.length > 0 && items.every((item) => item.top >= nav.top && item.bottom <= nav.bottom);
  });
  expect(categoriesFit).toBe(true);
  const addButton = page.getByRole("button", { name: /Dodaj u korpu/ });
  await expect(addButton).toBeVisible();
  await addButton.click();
  await expect(page.getByRole("link", { name: "Korpa, 1 artikala" })).toContainText("1");
});

test("točak kategorija razdvaja piće i hranu", async ({ page }) => {
  await page.goto("/");
  const drinks = page.getByRole("button", { name: "Piće", exact: true });
  const food = page.getByRole("button", { name: "Hrana", exact: true });
  // Oblik panela crta klijent posle merenja — dokaz da je točak hidriran i spreman.
  await expect(page.locator(".category-groups-plate")).toHaveAttribute("d", /^M /);
  await expect(drinks).toHaveAttribute("aria-pressed", "true");

  await food.click();
  await expect(food).toHaveAttribute("aria-pressed", "true");
  await expect(drinks).toHaveAttribute("aria-pressed", "false");
  await expect(page).toHaveURL(/\?category=/);

  const centered = page.locator('.category-slot[data-active="true"]');
  await expect(centered).toHaveCount(1);
  const scrolled = await page.evaluate(() => document.querySelector(".category-wheel")!.scrollLeft);
  expect(scrolled).toBeGreaterThan(0);
});

test("točak se posle skrola sam poravnava na kategoriju", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".category-groups-plate")).toHaveAttribute("d", /^M /);
  await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".category-wheel")!;
    for (let i = 0; i < 4; i += 1) track.dispatchEvent(new WheelEvent("wheel", { deltaY: 95, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".category-wheel")!;
    const active = track.querySelector<HTMLElement>('.category-slot[data-active="true"]')!;
    return {
      offset: Math.abs(active.offsetLeft + active.offsetWidth / 2 - track.scrollLeft - track.clientWidth / 2),
      moved: track.scrollLeft > 0,
    };
  });
  expect(state.moved).toBe(true);
  expect(state.offset).toBeLessThanOrEqual(1.5);
  await expect(page).toHaveURL(/\?category=/);
});

test("zamah pomera točak za tačno jednu kategoriju", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".category-groups-plate")).toHaveAttribute("d", /^M /);
  const names = await page.locator(".category-slot .category-label").allTextContents();
  const activeName = () => page.locator('.category-slot[data-active="true"] .category-label').textContent();
  const before = await activeName();

  // Brz zamah preko tri stavke — svejedno sme da pomeri samo jednu.
  await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".category-wheel")!;
    const y = track.getBoundingClientRect().top + track.clientHeight / 2;
    const at = (x: number) => ({ pointerId: 1, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y });
    track.dispatchEvent(new PointerEvent("pointerdown", at(300)));
    for (let step = 1; step <= 8; step += 1) window.dispatchEvent(new PointerEvent("pointermove", at(300 - step * 30)));
    window.dispatchEvent(new PointerEvent("pointerup", at(60)));
  });
  await page.waitForTimeout(1300);

  const after = await activeName();
  expect(names.indexOf(after ?? "") - names.indexOf(before ?? "")).toBe(1);
  const offset = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".category-wheel")!;
    const slot = track.querySelector<HTMLElement>('.category-slot[data-active="true"]')!;
    return Math.abs(slot.offsetLeft + slot.offsetWidth / 2 - track.scrollLeft - track.clientWidth / 2);
  });
  expect(offset).toBeLessThanOrEqual(1.5);
});

test("prikazuje najviše pet tačkica proizvoda", async ({ page }) => {
  await page.goto("/");
  // Streaming drži sadržaj u skrivenom segmentu (rect 0×0) dok se ne otkrije — čekamo pravi layout.
  await page.waitForFunction(() => {
    const strip = document.querySelector(".catalog-dots");
    return !!strip && strip.getBoundingClientRect().width > 0;
  });
  const dots = await page.evaluate(() => {
    const strip = document.querySelector(".catalog-dots");
    if (!strip) return null;
    const box = strip.getBoundingClientRect();
    const buttons = [...strip.querySelectorAll("button")];
    const inside = buttons.filter((button) => {
      const dot = button.getBoundingClientRect();
      return dot.left >= box.left - 1 && dot.right <= box.right + 1;
    });
    return { total: buttons.length, visible: inside.length };
  });
  expect(dots).not.toBeNull();
  expect(dots!.visible).toBeLessThanOrEqual(5);
  expect(dots!.visible).toBe(Math.min(5, dots!.total));
});

test("Android scroll pravila važe samo na početnom katalogu", async ({ page }) => {
  await page.goto("/");
  const home = await page.evaluate(() => ({
    supported: CSS.supports("overscroll-behavior", "none"),
    viewport: window.innerHeight,
    page: document.documentElement.scrollHeight,
    htmlOverscroll: getComputedStyle(document.documentElement).overscrollBehavior,
    bodyOverscroll: getComputedStyle(document.body).overscrollBehavior,
    catalogOverscroll: getComputedStyle(document.querySelector(".home-catalog")!).overscrollBehavior,
  }));
  expect(home.page).toBeLessThanOrEqual(home.viewport + 1);
  // Stariji WebKit ne implementira overscroll-behavior — tamo proveravamo samo visinu stranice.
  if (!home.supported) return;
  expect(home.htmlOverscroll).toBe("auto");
  expect(home.bodyOverscroll).toBe("auto");
  expect(home.catalogOverscroll).toBe("none");

  await page.goto("/korpa");
  const cart = await page.evaluate(() => ({
    htmlOverscroll: getComputedStyle(document.documentElement).overscrollBehavior,
    bodyOverscroll: getComputedStyle(document.body).overscrollBehavior,
  }));
  expect(cart.htmlOverscroll).toBe("auto");
  expect(cart.bodyOverscroll).toBe("auto");
});

test("promena proizvoda nema odsečenu senku", async ({ page }) => {
  await page.goto("/");
  const heading = page.locator(".catalog-product-stage h1");
  const first = (await heading.textContent()) ?? "";
  await page.getByRole("button", { name: /^Sledeći proizvod:/ }).click();
  await expect(heading).not.toHaveText(first);
  const imageFilters = await page.locator(".catalog-product-image > div").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).filter));
  expect(imageFilters.every((filter) => filter === "none")).toBe(true);
});

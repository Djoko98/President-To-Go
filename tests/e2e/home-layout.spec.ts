import { expect, test } from "@playwright/test";

test("početni katalog staje u vidljivi ekran bez skrolovanja", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lubenito" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerHeight, page: document.documentElement.scrollHeight }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  const categoriesFit = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>("[aria-label='Kategorije napitaka']")?.getBoundingClientRect();
    const labels = [...document.querySelectorAll<HTMLElement>("[aria-label='Kategorije napitaka'] button > span:nth-child(2)")].map((label) => label.getBoundingClientRect());
    return !!nav && labels.every((label) => label.top >= nav.top && label.bottom <= nav.bottom);
  });
  expect(categoriesFit).toBe(true);
  const addButton = page.getByRole("button", { name: /Dodaj u korpu/ });
  await expect(addButton).toBeVisible();
  await addButton.click();
  await expect(page.getByRole("link", { name: "Korpa, 1 artikala" })).toContainText("1");
});

test("Android scroll pravila važe samo na početnom katalogu", async ({ page }) => {
  await page.goto("/");
  const home = await page.evaluate(() => ({
    viewport: window.innerHeight,
    page: document.documentElement.scrollHeight,
    htmlOverscroll: getComputedStyle(document.documentElement).overscrollBehavior,
    bodyOverscroll: getComputedStyle(document.body).overscrollBehavior,
    catalogOverscroll: getComputedStyle(document.querySelector(".home-catalog")!).overscrollBehavior,
  }));
  expect(home.page).toBeLessThanOrEqual(home.viewport + 1);
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
  await page.getByRole("button", { name: "Prikaži Aperol Spritz" }).click();
  await expect(page.getByRole("heading", { name: "Aperol Spritz" })).toBeVisible();
  const imageFilters = await page.locator(".catalog-product-image > div").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).filter));
  expect(imageFilters.every((filter) => filter === "none")).toBe(true);
});

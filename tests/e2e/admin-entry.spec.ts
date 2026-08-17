import { expect, test } from "@playwright/test";

const logoName = "President To Go — početna";

async function tapLogo(page: import("@playwright/test").Page, times: number) {
  const box = await page.getByRole("link", { name: logoName }).boundingBox();
  if (!box) throw new Error("Logo nije vidljiv");
  await page.mouse.click(box.x + box.width / 2, box.y + 12, { clickCount: times, delay: 40 });
}

test("pet tapova na logo otvara admin prijavu i ostaje na njoj", async ({ page }) => {
  await page.goto("/");
  await tapLogo(page, 5);
  await expect(page).toHaveURL(/\/admin\/prijava/);
  // Zakazani odlazak na početnu je ranije preživeo navigaciju i vraćao nas sa prijave.
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/admin\/prijava/);
  await expect(page.getByRole("heading", { name: "Admin prijava" })).toBeVisible();
});

test("šesti tap ne vraća sa admin prijave na početnu", async ({ page }) => {
  await page.goto("/");
  await tapLogo(page, 6);
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/\/admin\/prijava/);
});

test("jedan tap na logo ostavlja gosta na početnoj", async ({ page }) => {
  await page.goto("/");
  await tapLogo(page, 1);
  await page.waitForTimeout(1200);
  await expect(page).toHaveURL(/\/(\?.*)?$/);
});

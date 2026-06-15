import { expect, test } from "@playwright/test";

const publicPages = [
  { path: "/", heading: "Sua aprovação" },
  { path: "/cadastro", heading: "Criar sua conta" },
  { path: "/login", heading: "Bem-vindo de volta" },
  { path: "/esqueci-senha", heading: "Recuperar senha" },
  { path: "/termos", heading: "Termos de uso" },
  { path: "/privacidade", heading: "Politica de privacidade" },
  { path: "/suporte", heading: "Como podemos ajudar?" },
];

for (const pageInfo of publicPages) {
  test(`${pageInfo.path} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(pageInfo.path);
    await expect(
      page.getByRole("heading", { name: pageInfo.heading, exact: false }).first(),
    ).toBeVisible();
    const sizes = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  });
}

test("signup exposes legal consent", async ({ page }) => {
  await page.goto("/cadastro");
  const form = page.locator("form");
  await expect(form.getByRole("checkbox")).toBeVisible();
  await expect(form.getByRole("link", { name: "Termos de uso" })).toBeVisible();
  await expect(form.getByRole("link", { name: "Politica de privacidade" })).toBeVisible();
});

test("invalid auth callback fails safely", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page.getByRole("heading", { name: "Link invalido" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar novo link" })).toBeVisible();
});

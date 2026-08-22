import { expect, test } from "@playwright/test";
import {
  assertNoBannedTerms,
  assertNoHorizontalOverflow,
  assertTouchTargets,
  assertTypeFloors,
  collectErrors,
  goto,
  ROUTES,
  WIDTHS,
} from "./helpers";

/**
 * Acceptance §K — the responsive sweep. Every route at every width in the contract:
 * no horizontal overflow, the right navigation for the width, touch targets at 44px,
 * type above the floors, no banned terminology, no console errors.
 */
for (const size of WIDTHS) {
  test.describe(`${size.name}px`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    for (const route of ROUTES) {
      test(`${route.name} holds the contract`, async ({ page }) => {
        const errors = collectErrors(page);
        await goto(page, route.path, route.ready);

        await assertNoHorizontalOverflow(page);
        await assertTypeFloors(page);
        await assertTouchTargets(page);
        await assertNoBannedTerms(page);

        // K2 — the 768 boundary swaps top bar for bottom bar.
        const topNav = page.locator("header nav[aria-label=Primary]");
        const bottomNav = page.locator("nav[aria-label=Primary].fixed");
        if (size.width >= 768) {
          await expect(topNav).toBeVisible();
          await expect(bottomNav).toBeHidden();
        } else {
          await expect(topNav).toBeHidden();
          await expect(bottomNav).toBeVisible();
          // K6 — labels may truncate but never disappear.
          await expect(bottomNav.getByText("Focus")).toBeVisible();
          await expect(bottomNav.getByText("Profile")).toBeVisible();
        }

        expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
      });
    }
  });
}

test.describe("verdict counts are never dropped", () => {
  for (const size of WIDTHS) {
    test(`${size.name}px keeps the counts on Discover`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await goto(page, "/discover", "Live Discovery");
      // K5 — verdict counts visible at every width.
      await expect(page.getByRole("tab", { name: /Apply/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /One fix/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Skip/ })).toBeVisible();
      // Search is never hidden.
      await expect(page.getByRole("search")).toBeVisible();
    });
  }
});

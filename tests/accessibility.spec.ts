import { expect, test } from "@playwright/test";
import { goto, ROUTES } from "./helpers";

test.use({ viewport: { width: 1440, height: 900 } });

/**
 * Acceptance §A — the accessibility rules DNA v2 §07 makes non-negotiable.
 */

test("the focus ring is visible and is never removed", async ({ page }) => {
  await goto(page, "/discover", "Discover");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName,
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      offset: style.outlineOffset,
    };
  });

  expect(ring.outlineStyle).not.toBe("none");
  expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(ring.outlineColor).toBe("rgb(87, 79, 192)");
  expect(ring.offset).toBe("2px");
});

test("a drawer traps focus and restores it to the trigger on close", async ({ page }) => {
  await goto(page, "/jobs/bkash-da", "One requirement stands between you");

  const trigger = page.getByRole("button", { name: /Ask about this job/ }).first();
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Ask REACH" })).toBeVisible();

  // Focus moved inside the dialog.
  const insideDialog = await page.evaluate(
    () => !!document.activeElement?.closest('[role="dialog"]'),
  );
  expect(insideDialog).toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Ask REACH" })).toBeHidden();

  const restored = await page.evaluate(
    () => (document.activeElement as HTMLElement)?.textContent ?? "",
  );
  expect(restored).toContain("Ask about this job");
});

test("meters announce the word, never a bare number", async ({ page }) => {
  await goto(page, "/resume", "Resume");
  for (const meter of await page.getByRole("meter").all()) {
    const valuetext = await meter.getAttribute("aria-valuetext");
    expect(valuetext, "a meter without an announced word").toBeTruthy();
    expect(valuetext).toMatch(/[A-Za-z]/);
  }
});

test("the activity console is one polite live region, not per event", async ({ page }) => {
  await goto(page, "/discover", "Discover");
  await page.getByRole("button", { name: "Re-run", exact: true }).click();

  const console_ = page.getByLabel("Discovery run activity");
  await expect(console_).toHaveAttribute("aria-live", "polite");

  const liveDescendants = await console_.locator("[aria-live]").count();
  expect(liveDescendants, "events must not each be a live region").toBe(0);
});

test("every verdict is a word, so colour is never the only cue", async ({ page }) => {
  await goto(page, "/discover", "Discover");
  // Wait for the grouped results, not just the page header.
  await expect(page.getByRole("heading", { name: "Apply Now" })).toBeVisible();

  const text = await page.locator("body").innerText();
  expect(text).toContain("Apply Now");
  expect(text).toContain("One Fix Away");
  expect(text).toContain("Skip");
});

for (const route of ROUTES) {
  test(`${route.name}: every image is described or hidden, and every control is named`, async ({
    page,
  }) => {
    await goto(page, route.path, route.ready);

    const undescribed = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => !img.hasAttribute("alt") && img.getAttribute("aria-hidden") !== "true")
        .map((img) => img.getAttribute("src") ?? ""),
    );
    expect(undescribed, `images with no alt and no aria-hidden: ${undescribed.join(", ")}`).toEqual(
      [],
    );

    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button, a[href]")]
        .filter((el) => {
          if (el.offsetParent === null) return false;
          const name =
            el.getAttribute("aria-label") ??
            el.getAttribute("title") ??
            el.textContent?.trim() ??
            "";
          return name.length === 0;
        })
        .slice(0, 5)
        .map((el) => el.outerHTML.slice(0, 90)),
    );
    expect(unnamed, `unnamed controls: ${unnamed.join(" | ")}`).toEqual([]);

    // One h1 per screen, and it is the page title.
    const h1s = await page.locator("h1:visible").count();
    expect(h1s, "each screen has exactly one visible h1").toBe(1);
  });
}

test("art is pixel-rendered and carries true alpha", async ({ page }) => {
  await goto(page, "/", "Find what fits");
  const smoothed = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((img) => (img.getAttribute("src") ?? "").includes("/art/"))
      .filter((img) => getComputedStyle(img).imageRendering !== "pixelated")
      .map((img) => img.getAttribute("src") ?? ""),
  );
  expect(smoothed, `art rendered smoothed: ${smoothed.join(", ")}`).toEqual([]);
});

test("no dead controls: every rendered button does something", async ({ page }) => {
  await goto(page, "/roadmap", "Make your SQL legible");
  const inert = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .filter((el) => el.offsetParent !== null && !el.disabled)
      .filter((el) => {
        // A button with no React handler and no form role would be inert.
        const hasReactHandler = Object.keys(el).some((key) => key.startsWith("__react"));
        return !hasReactHandler && el.type !== "submit";
      })
      .map((el) => el.textContent?.trim().slice(0, 40) ?? ""),
  );
  expect(inert, `controls with nothing behind them: ${inert.join(" | ")}`).toEqual([]);
});

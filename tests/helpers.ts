import { expect, type Page } from "@playwright/test";

/** The seven widths the responsive contract is validated at. */
export const WIDTHS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "430", width: 430, height: 932 },
  { name: "390", width: 390, height: 844 },
  { name: "360", width: 360, height: 800 },
] as const;

export const ROUTES = [
  { path: "/", name: "focus", ready: "Find what fits" },
  { path: "/discover", name: "discover", ready: "Discover" },
  { path: "/jobs/walton-jda", name: "job-apply-now", ready: "Junior Data Analyst" },
  { path: "/jobs/bkash-da", name: "job-one-fix", ready: "Data Analyst" },
  { path: "/jobs/gp-sds", name: "job-skip", ready: "Senior Data Scientist" },
  { path: "/one-fix/sql", name: "one-fix", ready: "Say SQL out loud." },
  { path: "/roadmap", name: "roadmap", ready: "Make your SQL legible" },
  { path: "/resume", name: "resume", ready: "Resume" },
  { path: "/profile", name: "profile", ready: "Niloy Mahmud" },
  { path: "/profile/settings", name: "settings", ready: "Analysis engine" },
] as const;

/** Waits until MSW has answered and the screen's own content is on the page. */
export async function goto(page: Page, path: string, ready: string) {
  await page.goto(path);
  // Scope to main: several screen titles also appear as nav labels, and matching
  // the nav would let a test run against a skeleton.
  const main = page.locator("main");
  await expect(main.locator("h1")).toBeVisible({ timeout: 20_000 });
  await expect(
    main.getByText(ready, { exact: false }).locator("visible=true").first(),
  ).toBeVisible({ timeout: 20_000 });
}

/** Terminology that is banned product-wide. */
export const BANNED = [
  "ATS score",
  "Resume score",
  "Match %",
  "Fit score",
  "Compatibility",
  "Career Twin",
  "Digital twin",
  "AI profile",
  "Candidate model",
  "Impact score",
  "Unlock score",
  "Quick win",
  "Almost there",
  "Near match",
  "Close fit",
  "Not a fit",
  "Poor match",
  "Strong match",
  "Top gap",
  "Weak area",
  "Agent thoughts",
];

export async function assertNoBannedTerms(page: Page) {
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const term of BANNED) {
    expect(text, `banned term "${term}" is rendered`).not.toContain(term.toLowerCase());
  }
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    culprits: [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.right > document.documentElement.clientWidth + 1;
      })
      .slice(0, 5)
      .map((el) => `${el.tagName}.${el.className.toString().slice(0, 70)}`),
  }));
  expect(
    overflow.scrollWidth,
    `horizontal overflow; first offenders: ${overflow.culprits.join(" | ")}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

/** 44×44 minimum on every interactive element that is actually visible. */
export async function assertTouchTargets(page: Page) {
  const small = await page.evaluate(() => {
    const selector = "button, a[href], input, select, [role=tab], [role=switch]";
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((el) => {
        if (el.offsetParent === null) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        // Links inside a paragraph are text, not targets.
        const inProse = el.closest("p, li, dd, td, h1, h2, h3");
        if (el.tagName === "A" && inProse) return false;
        // For a radio or checkbox the label is the target, not the box.
        const input = el as HTMLInputElement;
        if (input.type === "radio" || input.type === "checkbox") {
          const label = el.closest("label");
          if (label && label.getBoundingClientRect().height >= 40) return false;
        }
        return rect.height < 36 || rect.width < 20;
      })
      .slice(0, 6)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return `${el.tagName} "${(el.textContent ?? "").trim().slice(0, 26)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`;
      });
  });
  expect(small, `controls below the touch floor: ${small.join(" | ")}`).toEqual([]);
}

/** Nothing below 12px, body floor 14.5px on prose. */
export async function assertTypeFloors(page: Page) {
  const tooSmall = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        if (el.offsetParent === null) return false;
        if (!el.textContent?.trim()) return false;
        if (el.children.length > 0) return false;
        return parseFloat(getComputedStyle(el).fontSize) < 11.5;
      })
      .slice(0, 6)
      .map(
        (el) =>
          `${el.tagName} "${(el.textContent ?? "").trim().slice(0, 24)}" ${getComputedStyle(el).fontSize}`,
      ),
  );
  expect(tooSmall, `type below the 12px floor: ${tooSmall.join(" | ")}`).toEqual([]);
}

/** No console errors, and no failed requests. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    // A cancelled poll on teardown is not a defect.
    if (failure.includes("ERR_ABORTED") || failure.includes("net::ERR_FAILED")) return;
    errors.push(`request failed: ${request.url()} ${failure}`);
  });
  return errors;
}

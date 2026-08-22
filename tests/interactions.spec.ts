import { expect, test } from "@playwright/test";
import { collectErrors, goto } from "./helpers";

test.use({ viewport: { width: 1440, height: 900 } });

/* ── Discovery run ──────────────────────────────────────────────────────── */

test.describe("Discovery", () => {
  test("a run streams observable events, then collapses to one summary line", async ({ page }) => {
    await goto(page, "/discover", "Live Discovery");

    await page.getByRole("button", { name: "Re-run", exact: true }).click();

    const console_ = page.getByLabel("Discovery run activity");
    await expect(console_).toBeVisible();
    await expect(page.getByText("Activity Console")).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop run" })).toBeVisible();

    // C3 — the region is a polite live region, not per event.
    await expect(console_).toHaveAttribute("aria-live", "polite");

    // C2 — observable events only. No reasoning, no fake code.
    await expect(console_).toContainText("Loading your evidence record");
    await expect(page.locator("body")).not.toContainText("thinking");

    // C4 — completion collapses to the mono summary with Open log and Re-run.
    await expect(page.getByText(/RUN COMPLETE/i)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: "Open log" })).toBeVisible();
  });

  test("stopping a run moves no count and keeps the last completed run authoritative", async ({
    page,
  }) => {
    await goto(page, "/discover", "Live Discovery");
    const countOf = async () =>
      (await page.getByRole("tab", { name: /^Apply/ }).innerText()).replace(/\D/g, "");
    const before = await countOf();

    await page.getByRole("button", { name: "Re-run", exact: true }).click();
    await expect(page.getByRole("button", { name: "Stop run" })).toBeVisible();
    await page.getByRole("button", { name: "Stop run" }).click();

    await expect(page.getByLabel("Discovery run activity")).toBeHidden();
    expect(await countOf()).toBe(before);
    await expect(page.getByText(/RUN COMPLETE/i)).toBeVisible();
  });

  test("the canonical counts are 12 / 18 / 24 over 54 kept", async ({ page }) => {
    await goto(page, "/discover", "Live Discovery");
    await expect(page.getByRole("tab", { name: "Apply 12" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "One fix 18" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Skip 24" })).toBeVisible();
    await expect(page.getByText("54 opportunities")).toBeVisible();
  });

  // C12 / 12A — an empty set names its cause and quantifies the remedy.
  test("an empty result set names the filter that emptied it and offers a loosening", async ({
    page,
  }) => {
    await goto(page, "/discover?verdict=skip&mode=Remote", "Live Discovery");
    await expect(page.getByText(/Nothing matches/)).toBeVisible();
    await expect(page.getByText(/removes \d+ of them/)).toBeVisible();

    // Every loosening states the count it would return.
    const loosen = page.getByRole("button", { name: /\+\d+$/ }).first();
    await expect(loosen).toBeVisible();
    await loosen.click();
    await expect(page.getByText(/Nothing matches/)).toBeHidden();
  });

  // C13 / 12B — failure preserves and labels.
  test("a failed run keeps the last good results, names the engine, and excludes the Delta", async ({
    page,
  }) => {
    await goto(page, "/discover?state=failed", "Live Discovery");
    await expect(page.getByText("Run stopped part-way")).toBeVisible();
    await expect(page.getByText(/Engine:/)).toBeVisible();
    await expect(page.getByText("Showing the last completed run")).toBeVisible();
    await expect(page.getByRole("button", { name: "Keep these results" })).toBeVisible();
    // The results themselves are still on screen.
    await expect(page.getByRole("link", { name: "Junior Data Analyst" }).first()).toBeVisible();
  });

  test("saving a job survives a reload", async ({ page }) => {
    await goto(page, "/discover", "Live Discovery");
    const row = page.locator("tr", { hasText: "Junior Data Analyst" }).first();
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.reload();
    await expect(
      page.locator("tr", { hasText: "Junior Data Analyst" }).first().getByRole("button", { name: "Saved" }),
    ).toBeVisible({ timeout: 20_000 });
  });
});

/* ── Job Detail ─────────────────────────────────────────────────────────── */

test.describe("Job Detail", () => {
  test("the verdict is a sentence and no percentage appears", async ({ page }) => {
    await goto(page, "/jobs/walton-jda", "You meet every hard requirement");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\b\d{1,3}\s?%/);
    await expect(page.getByText("Apply Now").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Apply on company site/ }).first()).toBeVisible();
  });

  test("the One Fix Away variant hands off to the fix and explains why it is not a Skip", async ({
    page,
  }) => {
    await goto(page, "/jobs/bkash-da", "One requirement stands between you");
    await expect(page.getByText("Why this is not a Skip")).toBeVisible();
    await page.getByRole("link", { name: /See the One Fix/ }).first().click();
    await expect(page).toHaveURL(/\/one-fix\/sql/);
  });

  // 12C — the Skip action bar is not the Apply action bar.
  test("the Skip variant demotes Apply anyway to a text link", async ({ page }) => {
    await goto(page, "/jobs/gp-sds", "Senior Data Scientist");
    await expect(page.getByText("Hard blocker").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Show the/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Hide this role" })).toBeVisible();

    const applyAnyway = page.getByRole("link", { name: /Apply anyway/ }).first();
    await expect(applyAnyway).toBeVisible();
    // It is a link, never a button — the product advises, it does not forbid.
    expect(await applyAnyway.evaluate((el) => el.tagName)).toBe("A");
  });

  test("Previous and Next walk the group without returning to the list", async ({ page }) => {
    await goto(page, "/jobs/walton-jda", "Junior Data Analyst");
    await expect(page.getByText(/Role 1 of/)).toBeVisible();
    await page.getByRole("button", { name: "Next" }).first().click();
    await expect(page.getByText(/Role 2 of/)).toBeVisible();
    await expect(page).toHaveURL(/\/jobs\//);
  });
});

/* ── One Fix Away ───────────────────────────────────────────────────────── */

test.describe("One Fix Away", () => {
  test("the Delta is audited on the page and the exclusion is stated", async ({ page }) => {
    await goto(page, "/one-fix/sql", "Say SQL out loud.");
    await expect(page.getByText("How this was counted")).toBeVisible();
    await expect(page.getByText("Verified postings in today's run")).toBeVisible();
    await expect(page.getByText(/not counted/)).toBeVisible();
    await expect(page.getByText(/The 4 that need a second fix stay out of the number/)).toBeVisible();
  });

  test("all three gap types are shown, with two explicitly ruled out", async ({ page }) => {
    await goto(page, "/one-fix/sql", "Say SQL out loud.");
    await expect(page.getByText("Knowledge gap").first()).toBeVisible();
    await expect(page.getByText("Proof gap").first()).toBeVisible();
    await expect(page.getByText("This is your gap")).toBeVisible();
    await expect(page.getByText("Not this one")).toBeVisible();
  });

  test("every affected role links back into Job Detail", async ({ page }) => {
    await goto(page, "/one-fix/sql", "Say SQL out loud.");
    await page.getByRole("link", { name: "Analytics Associate" }).first().click();
    await expect(page).toHaveURL(/\/jobs\/gp-aa/);
  });
});

/* ── Roadmap ────────────────────────────────────────────────────────────── */

test.describe("Roadmap", () => {
  test("only the current milestone is expanded, and the free resource leads", async ({ page }) => {
    await goto(page, "/roadmap", "Make your SQL legible");
    await expect(page.getByText("Best free resource")).toBeVisible();
    await expect(page.getByText(/Paid alternative — only if/)).toBeVisible();
    await expect(page.getByText("Certificate verdict")).toBeVisible();
    await expect(page.getByText("Unnecessary")).toBeVisible();
    // The locked step stays one row tall — its detail is not rendered.
    await expect(page.getByText("Two suggested lines in the postings")).toBeHidden();
  });

  test("how we decide is inspectable", async ({ page }) => {
    await goto(page, "/roadmap", "Make your SQL legible");
    await page.getByRole("button", { name: /How we decide/ }).click();
    await expect(page.getByRole("dialog", { name: /certificate verdicts/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /certificate verdicts/i })).toBeHidden();
  });

  // 12E — completion reports realised against predicted, with no trophy.
  test("completing every milestone reports the realised delta and queues the next plan", async ({
    page,
  }) => {
    await goto(page, "/roadmap", "Make your SQL legible");
    for (let i = 0; i < 3; i += 1) {
      const done = page.getByRole("button", { name: "Mark done" });
      if (!(await done.isVisible().catch(() => false))) break;
      await done.click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText("Your SQL is legible")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Predicted +8")).toBeVisible();
    await expect(page.getByText(/One more than predicted/)).toBeVisible();
    await expect(page.getByText("Queued, not started.")).toBeVisible();
    // No celebration vocabulary anywhere.
    const text = await page.locator("main").innerText();
    expect(text.toLowerCase()).not.toMatch(/congratulations|streak|badge|xp|level up|trophy/);
  });
});

/* ── Resume ─────────────────────────────────────────────────────────────── */

test.describe("Resume", () => {
  test("the two meters stay separate and neither shows a number", async ({ page }) => {
    await goto(page, "/resume", "Resume Builder");
    await expect(page.getByText("ATS Readiness").first()).toBeVisible();
    await expect(page.getByText("JD Match").first()).toBeVisible();
    await expect(page.getByText("No job involved.")).toBeVisible();
    await expect(page.getByText(/Never averaged with ATS Readiness/)).toBeVisible();

    const meters = page.getByRole("meter");
    for (const meter of await meters.all()) {
      const label = await meter.getAttribute("aria-valuetext");
      expect(label).not.toMatch(/^\d+$/);
    }
  });

  // 12D — unavailable is never zero.
  test("with no JD selected, JD Match reads Not yet measured on an empty track", async ({ page }) => {
    await goto(page, "/resume", "Resume Builder");
    await page.getByRole("button", { name: "Clear" }).first().click();
    await expect(page.getByText("Not yet measured")).toBeVisible();
    await expect(page.getByText("It is never a score on its own.")).toBeVisible();
    await expect(page.getByText("Available without a job")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("0%");
  });

  test("the fabricated-metric edit is blocked and cannot be accepted", async ({ page }) => {
    await goto(page, "/resume", "Resume Builder");
    await page.getByRole("button", { name: /Review suggested edits/ }).click();

    const blocked = page.locator("article", { hasText: "No supporting evidence" });
    await expect(blocked).toBeVisible();
    const accept = blocked.getByRole("button", { name: /Accept/ });
    await expect(accept).toBeDisabled();
    await expect(accept).toHaveAttribute(
      "title",
      /No source of yours supports this claim/,
    );
    await expect(blocked.getByRole("link", { name: /Add the evidence/ })).toBeVisible();
  });

  test("accepting marks the preview pending and enables saving a new version", async ({ page }) => {
    await goto(page, "/resume", "Resume Builder");
    await page.getByRole("button", { name: /Review suggested edits/ }).click();

    const first = page.locator("article").first();
    await first.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(first.getByText("Accepted · applies on save")).toBeVisible();
    await expect(page.getByText("pending").first()).toBeVisible();

    const save = page.getByRole("button", { name: /Save version/ });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText(/Versions \(4\)/)).toBeVisible({ timeout: 15_000 });
  });

  test("sections reorder by keyboard-reachable controls", async ({ page }) => {
    await goto(page, "/resume", "Resume Builder");
    const firstBefore = await page.locator("li", { hasText: "Header & contact" }).first().innerText();
    await page.getByRole("button", { name: /Move Experience up/ }).click();
    await page.waitForTimeout(300);
    const firstAfter = await page.locator("ul li").first().innerText();
    expect(firstAfter).not.toEqual(firstBefore);
  });
});

/* ── Assistant ──────────────────────────────────────────────────────────── */

test.describe("Contextual assistant", () => {
  test("is closed on load, opens with the keyboard, and restores focus on Esc", async ({ page }) => {
    const errors = collectErrors(page);
    await goto(page, "/jobs/bkash-da", "One requirement stands between you");

    await expect(page.getByRole("dialog", { name: "Ask REACH" })).toBeHidden();

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog", { name: "Ask REACH" })).toBeVisible();
    await expect(page).toHaveURL(/ask=job/);

    // Scope is stated.
    await expect(page.getByText("This job · Data Analyst at bKash")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Ask REACH" })).toBeHidden();
    await expect(page).not.toHaveURL(/ask=/);
    expect(errors).toEqual([]);
  });

  test("answers cite evidence and end in a product action", async ({ page }) => {
    await goto(page, "/jobs/bkash-da", "One requirement stands between you");
    await page.getByRole("button", { name: /Ask about this job/ }).click();

    await page.getByRole("button", { name: /Why am I One Fix Away/ }).click();
    // Loading is a skeleton plus a mono status — never a spinner or typing dots.
    await expect(page.getByText(/Reading your evidence/)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("typing");

    await expect(page.getByText("Based on")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Open the fix" })).toBeVisible();
    await expect(page.getByText(/go through accept \/ reject/)).toBeVisible();
  });

  test("an engine failure names the engine and states nothing changed", async ({ page }) => {
    await goto(page, "/profile", "Niloy Mahmud");
    await page.getByRole("button", { name: /Ask about my evidence/ }).click();
    await page.getByLabel("Ask REACH about this object").fill("/fail");
    await page.getByRole("button", { name: "Send" }).click();

    const alert = page.getByRole("alert").filter({ hasText: "Nothing was changed" });
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(alert).toContainText("Nothing was changed");
    await expect(alert.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(alert.getByRole("button", { name: /Use ChatGPT instead/ })).toBeVisible();
  });
});

/* ── Settings ───────────────────────────────────────────────────────────── */

test.describe("Settings", () => {
  test("provider marks appear here and nowhere else", async ({ page }) => {
    await goto(page, "/profile/settings", "Analysis engine");
    const providerMarks = page.locator('img[src*="px-claude"], img[src*="px-chatgpt"]');
    expect(await providerMarks.count()).toBeGreaterThan(0);

    await goto(page, "/", "Your Focus");
    expect(await page.locator('img[src*="px-claude"], img[src*="px-chatgpt"]').count()).toBe(0);

    await goto(page, "/profile", "Niloy Mahmud");
    expect(await page.locator('img[src*="px-claude"], img[src*="px-chatgpt"]').count()).toBe(0);
  });

  test("every engine declares its exposure and the fallback is explicit", async ({ page }) => {
    await goto(page, "/profile/settings", "Analysis engine");
    expect(await page.getByText("Sees", { exact: true }).count()).toBe(4);
    expect(await page.getByText("Never sees", { exact: true }).count()).toBe(4);
    expect(await page.getByText("Retention", { exact: true }).count()).toBe(4);
    await expect(page.getByText(/retries once, then falls back to REACH-hosted/)).toBeVisible();
    await expect(page.getByText("What the engine cannot do")).toBeVisible();
  });

  // 12F — a recoverable error shows the workaround already in effect.
  test("a rejected key shows the fallback already running and evidence untouched", async ({
    page,
  }) => {
    await goto(page, "/profile/settings", "Analysis engine");
    await page.getByRole("button", { name: "Test connection" }).click();

    await expect(page.getByText("Your Claude API key was rejected")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/REACH-hosted is running your analyses in the meantime/)).toBeVisible();
    await expect(page.getByText(/an engine problem never touches your evidence/)).toBeVisible();
    await expect(page.getByText("Key invalid")).toBeVisible();
  });

  test("changing the engine warns about consequence, not danger", async ({ page }) => {
    await goto(page, "/profile/settings", "Analysis engine");
    await expect(page.getByText("One setting affects your results")).toBeVisible();
    await expect(
      page.getByText(/Opportunity Delta may move by a point or two. Eligibility verdicts will not change/),
    ).toBeVisible();
  });
});

/* ── Focus ──────────────────────────────────────────────────────────────── */

test.describe("Focus", () => {
  test("lists show exactly three rows plus a working see-all", async ({ page }) => {
    await goto(page, "/", "Your Focus");
    // Exactly 3 preview rows plus the see-all CTA.
    const applyCard = page
      .locator("div")
      .filter({ hasText: "Great matches you can apply for today." })
      .filter({ has: page.getByRole("link", { name: /Browse More Opportunities/ }) })
      .last();
    // Exactly three preview rows plus the see-all CTA.
    expect(await applyCard.getByRole("link").count()).toBe(4);

    await page.getByRole("link", { name: /Browse More Opportunities/ }).click();
    await expect(page).toHaveURL(/verdict=apply-now/);
  });

  test("the analysis engine is one status row that links to Settings", async ({ page }) => {
    await goto(page, "/", "Your Focus");
    await expect(page.getByText("REACH-hosted engine")).toBeVisible();
    await page.getByRole("link", { name: "Change in Settings" }).click();
    await expect(page).toHaveURL(/\/profile\/settings/);
  });

  test("search lands on Discover with the query applied", async ({ page }) => {
    await goto(page, "/", "Your Focus");
    await page.getByRole("searchbox").fill("bKash");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/discover\?q=bKash/);
  });
});

/* ── Reduced motion ─────────────────────────────────────────────────────── */

test.describe("Reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("count-ups resolve instantly and the console is a static list", async ({ page }) => {
    await goto(page, "/one-fix/sql", "Say SQL out loud.");
    // A9 — the projected figure is final immediately, not animated to.
    await expect(page.getByText("20", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("+8").first()).toBeVisible();
  });
});

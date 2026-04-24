import { expect, test } from "@playwright/test";

const SITE_URL = process.env.SITE_URL;

test.describe("Serverless Cloud Conversion Platform E2E", () => {
  test.skip(
    !SITE_URL,
    "SITE_URL environment variable must be set to the deployed static site URL."
  );

  test.beforeEach(async ({ page }) => {
    await page.goto(SITE_URL!);
  });

  test("renders the four-step conversion UI", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText(
      "Serverless Cloud Conversion Platform"
    );
    await expect(page.locator("#route-heading")).toHaveText(
      "1. Choose a conversion"
    );
    await expect(page.locator("#input-heading")).toHaveText("2. Provide input");
    await expect(page.locator("#convert-heading")).toHaveText("3. Convert");
  });

  test("dropdown lists all 10 conversion routes", async ({ page }) => {
    const count = await page.locator("#route option").count();
    expect(count).toBe(10);
  });

  test("pre-selects the first route and populates the example panel", async ({
    page
  }) => {
    await expect(page.locator("#route")).toHaveValue("json_to_text");
    await page.locator("#route-example summary").click();
    await expect(page.locator("#example-input")).toContainText("Student One");
    await expect(page.locator("#example-output")).toContainText(
      "Name: Student One"
    );
  });

  test("converts json_to_text end-to-end", async ({ page }) => {
    await page.locator("#route").selectOption("json_to_text");
    await page
      .locator("#text-input")
      .fill('{"name":"E2E Test","status":"ok"}');
    await page.locator("#convert-button").click();

    await expect(page.locator("#output-section")).toBeVisible({
      timeout: 30_000
    });
    await expect(page.locator("#output-preview")).toHaveText(
      "Name: E2E Test\nStatus: ok"
    );
    await expect(page.locator("#status")).toContainText(
      "Conversion succeeded"
    );
  });

  test("download button produces a file with the expected extension", async ({
    page
  }) => {
    await page.locator("#route").selectOption("json_to_text");
    await page
      .locator("#text-input")
      .fill('{"message":"download-test"}');
    await page.locator("#convert-button").click();
    await expect(page.locator("#output-section")).toBeVisible({
      timeout: 30_000
    });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#download-button").click()
    ]);

    expect(download.suggestedFilename()).toMatch(/\.txt$/);
  });

  test("surfaces a structured error when validation fails", async ({ page }) => {
    await page.locator("#route").selectOption("json_to_text");
    await page.locator("#text-input").fill("not json");
    await page.locator("#convert-button").click();

    await expect(page.locator("#status.error")).toBeVisible({
      timeout: 30_000
    });
    await expect(page.locator("#status")).toContainText(/JSON/i);
    await expect(page.locator("#output-section")).toBeHidden();
  });

  test("switching route updates the description and accepted extensions", async ({
    page
  }) => {
    await page.locator("#route").selectOption("markdown_to_html");
    await expect(page.locator("#route-description")).toContainText(/Markdown/i);
    await expect(page.locator("#route-description")).toContainText(".md");
  });
});

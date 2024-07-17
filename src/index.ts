import puppeteer, { ElementHandle, Page } from "puppeteer";
// import puppeteer, { ElementHandle, Page } from "puppeteer-core";
import { randomTimeRange } from "./helpers";
import { Agency, type AgencyProperty } from "./types";
import { sendAllEmails } from "./email_service/sendAllEmails";
import { VESTEDA_CLASS_NAMES, VESTEDA_SEARCH_URL } from "./constants";
import { testDeletePropertyToCheck } from "./tests";

function infoWithDate(message: string) {
  console.info(new Date().toISOString() + ": " + message);
}

let spanTexts: Set<string> = new Set<string>();

async function resetAndCreateNewSetOfElements(elements: ElementHandle<any>[]) {
  infoWithDate("Resetting db...");
  // Reset the set of elements from scratch
  spanTexts = new Set<string>();

  // Push new elements to the set
  for (const span of elements) {
    if (span != null) {
      const spanText = await span.evaluate(
        (el: { textContent: string }) => el.textContent
      );
      if (typeof spanText === "string" && !spanTexts.has(spanText)) {
        spanTexts.add(spanText);
      }
    }
  }
}

async function createNewSet(page: Page) {
  const firstFilter = await page.$$(VESTEDA_CLASS_NAMES.join(""));
  const newElements: ElementHandle<any>[] = [];
  if (firstFilter && firstFilter.length > 0) {
    for (const filteredElement of firstFilter) {
      const elements = await filteredElement.$$(".h4");
      newElements.push(...elements);
    }
  }
  return newElements;
}

async function crawlPage() {
  const browser = await puppeteer.launch({
    // executablePath: "/usr/bin/chromium-browser",
  });
  const page = await browser.newPage();

  try {
    await page.goto(VESTEDA_SEARCH_URL);

    const elements = await createNewSet(page);

    if (elements != null) {
      // If the set already exists:
      if (spanTexts.size > 0) {
        infoWithDate("Checking if there are changes in the property list...");

        let newElements: Set<string> = new Set<string>();

        const spanTextsKeys = Array.from(spanTexts.keys());

        // Test
        // const spanTextsKeys = testDeletePropertyToCheck(spanTexts);

        for (const span of elements) {
          const spanText = await span.evaluate((el) => el.textContent);
          if (spanText && !spanTextsKeys.includes(spanText)) {
            newElements.add(spanText);
          }
        }

        if (newElements.size > 0) {
          const agencyProperties: AgencyProperty = new Map();
          const newElementsArray = Array.from(newElements.values());

          console.info("New elements: ", newElementsArray);

          for (const newElement of newElementsArray) {
            const previous = agencyProperties.get(Agency.Vesteda);
            if (!previous) {
              agencyProperties.set(Agency.Vesteda, [newElement]);
            } else {
              agencyProperties.set(Agency.Vesteda, [...previous, newElement]);
            }
          }

          await sendAllEmails(agencyProperties);

          // Reset and create new set
          infoWithDate("Resetting data as we found an actual property :) ...");
          spanTexts = new Set();
          // await resetAndCreateNewSetOfElements(elements);
        }

        // Creating a new set
      } else {
        await resetAndCreateNewSetOfElements(elements);
      }
    }
  } catch (error) {
    console.error("Error during crawling:", error);
  } finally {
    await browser.close();
  }
}

async function startCrawling() {
  // Run the crawl function every 3 minutes (180 seconds)
  while (true) {
    infoWithDate("Crawling page...");
    await crawlPage();
    const randomIntervalMs = randomTimeRange(25, 45); // between 1 and 2 minutes
    console.log(randomIntervalMs);
    await new Promise((resolve) => setTimeout(resolve, randomIntervalMs));
  }
}

await startCrawling();

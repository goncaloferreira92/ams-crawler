import type { FileSink } from "bun";

// import puppeteer, { ElementHandle, Page } from "puppeteer";
import puppeteer, { ElementHandle, Page } from "puppeteer-core";

import { infoWithDate, randomTimeRange } from "./helpers";
import { Agency, type AgencyProperty } from "./types";
import { sendAllEmails } from "./email_service/sendAllEmails";
import { AGENCY_URL_MAP, VESTEDA_CLASS_NAMES } from "./constants";

import { initLog } from "./log_service/logService";
// import { testDeletePropertyToCheck } from "./tests";

let fileWriter: FileSink = await initLog();

const agencyCheckList: AgencyProperty = new Map();
let newEntries: AgencyProperty = new Map();

async function resetAndCreateNewSetOfElements(
  elements: ElementHandle<any>[],
  agency: Agency
) {
  infoWithDate(`Resetting ${agency} database...`, fileWriter);
  // Reset the set of elements from scratch
  agencyCheckList.set(agency, new Set());
  const agencySet = agencyCheckList.get(agency);

  if (agencySet != null) {
    // Push new elements to the set
    for (const span of elements) {
      if (span != null) {
        const spanText = await span.evaluate(
          (el: { textContent: string }) => el.textContent
        );
        const alreadyExists = agencySet.has(spanText);
        if (typeof spanText === "string" && !alreadyExists) {
          agencySet.add(spanText);
        }
      }
    }
  }
}

async function createNewSet(page: Page, agency: Agency) {
  switch (agency) {
    default:
    case Agency.Vesteda: {
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
    case Agency.Funda: {
      // data-test-id="street-name-house-number"
      const firstFilter = await page.$$('[data-test-id^=""]');
      console.log(firstFilter.length);

      return;
    }
    case Agency.Vanderlinden: {
      infoWithDate(
        `Not yet implemented for ${agency} agency, skipping...`,
        fileWriter
      );
      return;
    }
    case Agency.VB_T: {
      infoWithDate(
        `Not yet implemented for ${agency} agency, skipping...`,
        fileWriter
      );
      return;
    }
    case Agency.Koops: {
      const newElements: ElementHandle<any>[] = [];
      await page.select('[name="rent_or_sale"]', "rent");

      // await page.select('[name="price_range"]', '0;1500');
      await page.select('[name="price_range"]', "1500;2000");

      await new Promise((res) => setTimeout(res, 2000));

      const firstFilter = await page.$$(".flex-combine");
      // const firstFilter = await page.$$(".o-media__title");

      for (const container of firstFilter) {
        const titleContainer = await container.$(".o-media__title");
        if (titleContainer != null) {
          const titleEl = await titleContainer.$("h4");
          if (titleEl != null) {
            // const title = await titleContainer.evaluate((el) => el.textContent);
            newElements.push(titleContainer);
          }
        }
      }

      // const title = await container
      //   .$(".o-media__title")
      //   .then((res) => res && res.$(".h4"));
      // console.log(title);
      // div class="o-media__title" > h4 > content
      // div class="street" > content
      // div class="price" > content > 2nd string
      // console.log("koops...");

      return newElements;
    }
  }
}

function updateAgencyCheckList(agency: Agency, newElements: Set<string>) {
  const previous = agencyCheckList.get(agency);
  if (!previous) {
    agencyCheckList.set(agency, new Set([...newElements]));
  } else {
    newElements.forEach((newElement) => previous.add(newElement));
  }
}

async function crawlProperties(page: Page, agency: Agency, url: string) {
  // Load page
  await page.goto(url);

  const elements = await createNewSet(page, agency);
  const previousCheckedProperties = agencyCheckList.get(agency);

  if (elements != null) {
    // If the set already exists:
    if (
      previousCheckedProperties != null &&
      previousCheckedProperties.size > 0
    ) {
      infoWithDate(
        `Checking if there are changes in ${agency}'s the property list...`,
        fileWriter
      );

      let newElements: Set<string> = new Set<string>();
      const spanTextsKeys = Array.from(previousCheckedProperties);

      // Test
      // const spanTextsKeys = testDeletePropertyToCheck(previousCheckedProperties);
      // const previous = Array.from(previousCheckedProperties);
      // console.log(previous.length)
      // console.log(spanTextsKeys.length);

      for (const textContainer of elements) {
        const text = await textContainer.evaluate(
          (container) => container.textContent
        );

        if (text && !spanTextsKeys.includes(text)) {
          newElements.add(text);
        }
      }

      if (newElements.size > 0) {
        updateAgencyCheckList(agency, newElements);
        updateNewEntries(agency, newElements);
      } else {
        infoWithDate(
          `No new entries found on ${agency}, restarting later...`,
          fileWriter
        );
      }

      // Creating a new set
    } else {
      infoWithDate(
        `Agency ${agency} did not have any entries, resetting...`,
        fileWriter
      );
      await resetAndCreateNewSetOfElements(elements, agency);
    }
  }
}

function resetNewEntries() {
  newEntries = new Map();
}

function updateNewEntries(agency: Agency, newElements: Set<string>) {
  for (const newElement of Array.from(newElements)) {
    // console.info(newElement);
    let newEntriesAgency = newEntries.get(agency);
    // console.info(newEntriesAgency);
    if (newEntriesAgency != null) {
      newEntriesAgency.add(newElement);
    } else {
      newEntries.set(agency, new Set([newElement]));
    }
  }
  // console.info(newEntries);
}

async function handleNewEntries() {
  if (newEntries.size > 0) {
    infoWithDate("Found new propertie(s)! :) Resetting...", fileWriter);
    await sendAllEmails(newEntries, fileWriter);
    newEntries = new Map();
    resetNewEntries();
  }
}

async function crawlPage() {
  const browser = await puppeteer.launch({
    // headless: false,
    executablePath: "/usr/bin/chromium-browser",
  });

  const page = await browser.newPage();

  try {
    for (const [agency, url] of AGENCY_URL_MAP) {
      await crawlProperties(page, agency, url);
      await handleNewEntries();
    }
  } catch (error) {
    console.error("Error during crawling:", error);
  } finally {
    await browser.close();
    await fileWriter.flush();
  }
}

async function startCrawling() {
  while (true) {
    infoWithDate("Crawling page...", fileWriter);
    await crawlPage();
    // const randomIntervalMs = randomTimeRange(3, 4);
    const randomIntervalMs = randomTimeRange(10, 25);
    console.log(randomIntervalMs);
    await new Promise((resolve) => setTimeout(resolve, randomIntervalMs));
  }
}

await startCrawling();

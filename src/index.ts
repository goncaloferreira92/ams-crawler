import type { FileSink } from "bun";

// import puppeteer, { ElementHandle, Page } from "puppeteer";
import puppeteer, { ElementHandle, Page } from "puppeteer-core";

import { infoWithDate, randomTimeRange } from "./helpers";
import { Agency, type AgencyProperty } from "./types";
import { sendAllEmails } from "./email_service/sendAllEmails";
import { VESTEDA_CLASS_NAMES, VESTEDA_SEARCH_URL } from "./constants";

import { initLog } from "./log_service/logService";
import { testDeletePropertyToCheck } from "./tests";

let fileWriter: FileSink = await initLog();

const agencyCheckList: AgencyProperty = new Map();
let newEntries: AgencyProperty = new Map();

async function resetAndCreateNewSetOfElements(
  elements: ElementHandle<any>[],
  agency: Agency
) {
  infoWithDate("Resetting database...", fileWriter);
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

async function crawlAgencies(page: Page, agency: Agency) {
  const elements = await createNewSet(page, agency);
  const spanTexts = agencyCheckList.get(agency);

  if (elements != null) {
    // If the set already exists:
    if (spanTexts != null && spanTexts.size > 0) {
      infoWithDate(
        `Checking if there are changes in ${agency}'s the property list...`,
        fileWriter
      );

      let newElements: Set<string> = new Set<string>();
      const spanTextsKeys = Array.from(spanTexts);

      // Test
      // const previous = Array.from(spanTexts);
      // console.log(previous.length)
      // const spanTextsKeys = testDeletePropertyToCheck(spanTexts);
      // console.log(spanTextsKeys.length);

      for (const span of elements) {
        const spanText = await span.evaluate((el) => el.textContent);
        if (spanText && !spanTextsKeys.includes(spanText)) {
          newElements.add(spanText);
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
        `Agency ${spanTexts} did not have any entries, resetting...`,
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
    console.log(newElement);
    let newEntriesAgency = newEntries.get(agency);
    console.log(newEntriesAgency);
    if (newEntriesAgency != null) {
      newEntriesAgency.add(newElement);
    } else {
      newEntries.set(agency, new Set([newElement]));
    }
  }
  console.log(newEntries);
}

async function handleNewEntries() {
  if (newEntries.size > 0) {
    infoWithDate("Found new propertie(s)! :) Resetting...", fileWriter);
    await sendAllEmails(newEntries, fileWriter);
    newEntries = new Map();
    resetNewEntries();
  }
}

const listAgencies: Agency[] = [Agency.Vesteda];

async function crawlPage() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
  });

  const page = await browser.newPage();

  try {
    for (const agency of listAgencies) {
      await page.goto(VESTEDA_SEARCH_URL);
      await crawlAgencies(page, agency);
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
  // Run the crawl function every 3 minutes (180 seconds)
  while (true) {
    infoWithDate("Crawling page...", fileWriter);
    await crawlPage();
    // const randomIntervalMs = randomTimeRange(3, 4);
    const randomIntervalMs = randomTimeRange(25, 45);
    console.log(randomIntervalMs);
    await new Promise((resolve) => setTimeout(resolve, randomIntervalMs));
  }
}

await startCrawling();

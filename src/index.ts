// import puppeteer, { ElementHandle, Page } from "puppeteer";
import puppeteer, { ElementHandle, Page } from "puppeteer-core";
import sendEmail from "../sendEmail";
import { randomTimeRange } from "./helpers";
import { Agency, type AgencyProperty } from "./types";

const vestedaUrl =
  "https://www.vesteda.com/en/unit-search?placeType=1&sortType=1&radius=20&s=Amsterdam&sc=woning&latitude=52.36757278442383&longitude=4.904139041900635&filters=&priceFrom=500&priceTo=1500";

const parariusUrl =
  "https://www.pararius.com/apartments/amsterdam/1000-1500/upholstered";

const vestedaClassNames = [
  ".o-card",
  ".o-card--listview",
  ".o-card--listing",
  ".o-card--clickable",
  ".o-card--shadow-small",
];

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
  const firstFilter = await page.$$(vestedaClassNames.join(""));
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
    executablePath: "/usr/bin/chromium-browser",
  });
  const page = await browser.newPage();

  try {
    await page.goto(vestedaUrl);

    const elements = await createNewSet(page);

    if (elements != null) {
      // If the set already exists:
      if (spanTexts.size > 0) {
        infoWithDate("Checking if there are changes in the property list...");

        let newElements: Set<string> = new Set<string>();

        const spanTextsKeys = Array.from(spanTexts.keys());

        for (const span of elements) {
          const spanText = await span.evaluate((el) => el.textContent);
          if (spanText && !spanTextsKeys.includes(spanText)) {
            newElements.add(spanText);
          }
        }

        if (newElements.size > 0) {
          const agencyProperties: AgencyProperty = new Map();
          const newElementsArray = Array.from(newElements.values());

          console.log(newElementsArray);
          for (const newElement of newElementsArray) {
            const previous = agencyProperties.get(Agency.Vesteda);
            if (!previous) {
              agencyProperties.set(Agency.Vesteda, [newElement]);
            } else {
              agencyProperties.set(Agency.Vesteda, [...previous, newElement]);
            }
          }

          await sendEmails(agencyProperties);

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
    const randomIntervalMs = randomTimeRange(60, 120); // between 1 and 2 minutes
    console.log(randomIntervalMs);
    await new Promise((resolve) => setTimeout(resolve, randomIntervalMs));
  }
}

await startCrawling();

export async function sendEmails(agencyProperties: AgencyProperty) {
  try {
    infoWithDate("Found new properties! Sending emails...");
    const html = ["<h4>Let's submit! Our app found something here:</h4>"];
    for (const [agency, properties] of agencyProperties.entries()) {
      const agencyPropertyHtml = `<span>${agency}:</span>
               <ul>${properties
                 .map((property) => `<li>Property name: ${property}</li>`)
                 .join("")}</ul>`;
      html.push(agencyPropertyHtml);
    }

    await sendEmail({
      from: "goncalojferreira92@gmail.com",
      to: "goncalojferreira92@gmail.com",
      subject: `Found a new for Amsterdam!`,
      html: html.join("\n"),
    });

    await sendEmail({
      from: "goncalojferreira92@gmail.com",
      to: "veronique.kuperstein@gmail.com",
      subject: `Found a new for Amsterdam!`,
      html: html.join("\n"),
    });

    infoWithDate("Emails successfully sent! 👏");
  } catch (err) {
    console.error(
      new Error(new Date().toISOString() + ": Could not send emails")
    );
    if (err instanceof Error) {
      console.error(err);
    } else
      console.error(
        new Error(
          new Date().toISOString() + ": Could not identify the error type."
        )
      );
  }
}

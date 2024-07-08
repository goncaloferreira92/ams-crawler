import puppeteer, { ElementHandle, Page } from "puppeteer";
import sendEmail from "./sendEmail";

const vestedaUrl =
  "https://www.vesteda.com/en/unit-search?placeType=1&sortType=1&radius=20&s=Amsterdam&sc=woning&latitude=52.36757278442383&longitude=4.904139041900635&filters=&priceFrom=500&priceTo=1500";

const vestedaClassNames = [
  ".o-card",
  ".o-card--listview",
  ".o-card--listing",
  ".o-card--clickable",
  ".o-card--shadow-small",
];

let spanTexts: Set<string> = new Set<string>();

// async function addElementsToSet(elements: ElementHandle<any>[]) {
//   for (const span of elements) {
//     if (span != null) {
//       const spanText = await span.evaluate((el) => el.textContent);
//       //  if (typeof spanText === "string" && !spanTexts.has(spanText)) {
//       //    spanTexts.add(spanText);
//       //  };
//     }
//   }
// }

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

// async function checkIfThereAreChangesInSet(elements: ElementHandle<any>[]) {
//   for (const span of elements) {
//     //     const spanText = await span.evaluate((el) => el.textContext);
//     //     if (spanText && !spanTexts.has(spanText)) {
//     //       console.info("Found one!");
//     //     }
//   }
//   console.info("Did not find anything new :)");
// }

async function crawlPage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(vestedaUrl);

    const elements = await createNewSet(page);

    if (elements != null) {
      // If the set already exists:
      if (spanTexts.size > 0) {
        console.info("Checking if there are changes in set...");
        // checkIfThereAreChangesInSet(elements);

        // Test deleting an element to check if it will send a message
        const spanTextsKeys = Array.from(spanTexts.keys());
        spanTextsKeys.splice(3, 5);

        let warningMessages: Set<string> = new Set<string>();

        for (const span of elements) {
          const spanText = await span.evaluate((el) => el.textContent);
          if (spanText && !spanTextsKeys.includes(spanText)) {
            warningMessages.add(`Warning message ${warningMessages.size + 1}`);
          }
        }

        console.info(Array.from(warningMessages.keys()));
        //    console.info("Did not find anything new :)");

        // Creating a new set
      } else {
        //    addElementsToSet(elements);
        for (const span of elements) {
          if (span != null) {
            const spanText = await span.evaluate((el) => el.textContent);
            if (typeof spanText === "string" && !spanTexts.has(spanText)) {
              spanTexts.add(spanText);
            }
          }
        }
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
    console.info("Crawling page...");
    await crawlPage();
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// startCrawling();

await sendEmail({
  from: "goncalojferreira92@gmail.com",
  to: "goncalojferreira92@gmail.com",
  subject: "test",
  html: "<div>This is the body of the email</div>",
});

import puppeteer, { Page } from "puppeteer";

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

async function createNewSet(page: Page) {
  const firstFilter = await page.$$(vestedaClassNames.join(""));
  if (firstFilter && firstFilter.length > 0) {
    for (const filteredElement of firstFilter) {
      const elements = await filteredElement.$$("span");
      for (const span of elements) {
        if (span != null) {
          const spanText = await span.evaluate((el) => el.textContent);
          if (typeof spanText === "string" && !spanTexts.has(spanText)) {
            spanTexts.add(spanText);
          } else continue;
        }
      }
    }
  }
  console.log(spanTexts.keys());
}

async function checkIfThereAreChangesInSet() {
     // TODO Goncalo
}

async function crawlPage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(vestedaUrl);

    if (spanTexts.size > 0) {
    } else {
      createNewSet(page);
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

startCrawling();

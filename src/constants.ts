import { Agency, type AgencyUrlMap } from "./types";

export const VESTEDA_SEARCH_URL =
  "https://www.vesteda.com/en/unit-search?placeType=1&sortType=1&radius=20&s=Amsterdam&sc=woning&latitude=52.36757278442383&longitude=4.904139041900635&filters=&priceFrom=500&priceTo=1500";

export const FUNDA_SEARCH_URL = 
  `https://www.funda.nl/zoeken/huur?selected_area=["amsterdam"]&publication_date="5"&price="1000-1500"&availability=["available"]`;

export const AGENCY_URL_MAP: AgencyUrlMap = new Map([
  [Agency.Vesteda, VESTEDA_SEARCH_URL],
  // [Agency.Funda, FUNDA_SEARCH_URL],
]);

export const VESTEDA_CLASS_NAMES = [
  ".o-card",
  ".o-card--listview",
  ".o-card--listing",
  ".o-card--clickable",
  ".o-card--shadow-small",
];

// export const parariusUrl =
//   "https://www.pararius.com/apartments/amsterdam/1000-1500/upholstered";

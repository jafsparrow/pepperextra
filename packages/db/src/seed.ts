import "dotenv/config";
import { createDatabaseClient } from "./client.js";
import { countries, currencies } from "./schemas/localization.js";

const currenciesData = [
  {
    id: "OMR",
    code: "OMR",
    name: "Omani Rial",
    symbol: "OMR",
    decimalPlaces: 3,
    minorUnitPerMajor: 1000,
  },
  {
    id: "AED",
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    decimalPlaces: 2,
    minorUnitPerMajor: 100,
  },
  {
    id: "INR",
    code: "INR",
    name: "Indian Rupee",
    symbol: "INR",
    decimalPlaces: 2,
    minorUnitPerMajor: 100,
  },
  {
    id: "USD",
    code: "USD",
    name: "US Dollar",
    symbol: "USD",
    decimalPlaces: 2,
    minorUnitPerMajor: 100,
  },
];

const countriesData = [
  {
    id: "OM",
    name: "Oman",
    isoCode: "OM",
    currencyId: "OMR",
    defaultVatRate: 500,
  },
  {
    id: "AE",
    name: "United Arab Emirates",
    isoCode: "AE",
    currencyId: "AED",
    defaultVatRate: 500,
  },
  {
    id: "IN",
    name: "India",
    isoCode: "IN",
    currencyId: "INR",
    defaultVatRate: 1800,
  },
  {
    id: "US",
    name: "United States",
    isoCode: "US",
    currencyId: "USD",
    defaultVatRate: 0,
  },
];

async function main() {
  const url = process.env.PEPPER_DATABASE_URL;
  if (!url) {
    throw new Error("PEPPER_DATABASE_URL is missing from the environment");
  }

  const db = createDatabaseClient(url);

  try {
    await db.insert(currencies).values(currenciesData).onConflictDoNothing();
    await db.insert(countries).values(countriesData).onConflictDoNothing();
    console.log("Seeded currencies and countries successfully");
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

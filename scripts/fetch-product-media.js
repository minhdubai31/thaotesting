// Fetches product images and short descriptions from Wikipedia and writes prisma/product-media.json.
// Run it once (or when you add products): node scripts/fetch-product-media.js
// Only exact-model pages are used. A product with no matching page gets no image or description.

const fs = require("fs");
const path = require("path");

// SKU -> Wikipedia page titles to try, in order.
const pageTitles = {
  "APL-IP17PM-256": ["IPhone_17_Pro"],
  "APL-IP17-256": ["IPhone_17"],
  "APL-IP16-128": ["IPhone_16"],
  "APL-IPADA16-128": ["IPad_(10th_generation)"],
  "APL-AW11-42": ["Apple_Watch_Series_10"],
  "APL-AP4": ["AirPods"],
  "SAM-S26-256": ["Samsung_Galaxy_S26"],
  "SAM-A57-256": ["Samsung_Galaxy_A57"],
  "SAM-A55-128": ["Samsung_Galaxy_A55"],
  "SAM-A16-128": ["Samsung_Galaxy_A16"],
  "SAM-TABS10FE": ["Samsung_Galaxy_Tab_S10_FE", "Samsung_Galaxy_Tab_S10"],
  "SAM-BUDS3": ["Samsung_Galaxy_Buds3", "Samsung_Galaxy_Buds_3"],
  "SAM-WATCH8": ["Samsung_Galaxy_Watch8", "Samsung_Galaxy_Watch"],
  "XIA-17T": ["Xiaomi_17T", "Xiaomi_17"],
  "XIA-RN14-256": ["Redmi_Note_14"],
  "XIA-R14C-128": ["Redmi_14C", "Redmi_14"],
  "XIA-BAND9": ["Xiaomi_Smart_Band_9"],
  "OPP-FX9S-256": ["OPPO_Find_X9", "OPPO_Find_X9s"],
  "OPP-FX9U-512": ["OPPO_Find_X9_Ultra", "OPPO_Find_X9"],
  "SNY-WH1000XM5": ["Sony_WH-1000XM5", "WH-1000XM5"],
  "JBL-GO4": ["JBL_Go_4", "JBL_Go_series"],
};

const outputFile = path.resolve(__dirname, "../prisma/product-media.json");
const USER_AGENT = "thaotesting-seed/1.0 (sample product data)";

async function fetchSummary(title) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } }
  );

  if (!response.ok) return null;

  const json = await response.json();
  if (!json.thumbnail || json.type === "disambiguation") return null;

  // Keep the description short enough for a product card.
  const extract = (json.extract || "").trim();
  const description = extract.length > 400 ? `${extract.slice(0, 397).trimEnd()}...` : extract;

  return {
    imageUrl: json.thumbnail.source,
    description: description || null,
    source: json.content_urls?.desktop?.page || null,
  };
}

async function main() {
  const media = {};

  for (const [sku, titles] of Object.entries(pageTitles)) {
    let found = null;

    for (const title of titles) {
      found = await fetchSummary(title);
      if (found) break;
    }

    media[sku] = found;
    console.log(`${found ? "ok  " : "none"} ${sku}`);
  }

  fs.writeFileSync(outputFile, `${JSON.stringify(media, null, 2)}\n`);
  console.log(`Wrote ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

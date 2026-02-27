// lib/parse-csv.js
// Parses Shopify-exported CSVs into the data structure the dashboard expects
//
// Expected CSV filenames in each store folder:
//   Net_sales_over_time_*.csv
//   Conversion_rate_over_time_*.csv
//   Average_order_value_over_time_*.csv
//   Sessions_by_Referrer_*.csv
//   Performance_by_UTM_campaign_*.csv

import Papa from "papaparse";

function parseCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

// Find a CSV by partial filename match
function findCSV(files, pattern) {
  const key = Object.keys(files).find((name) =>
    name.toLowerCase().includes(pattern.toLowerCase())
  );
  return key ? parseCSV(files[key]) : [];
}

// Parse net sales CSV
function parseSales(rows) {
  const sales = [];
  const salesPrior = [];

  rows.forEach((row) => {
    const s = row["Net sales"] || row["net_sales"] || 0;
    const sp =
      row["Net sales (previous_period)"] ||
      row["net_sales_previous_period"] ||
      0;
    sales.push(
      typeof s === "number" ? s : parseFloat(String(s).replace(/[$,]/g, "")) || 0
    );
    salesPrior.push(
      typeof sp === "number" ? sp : parseFloat(String(sp).replace(/[$,]/g, "")) || 0
    );
  });

  return { sales, salesPrior };
}

// Parse conversion rate CSV — includes funnel stages
function parseConversion(rows) {
  const conv = [];
  const sessions = [];
  const cartAdds = [];
  const reachedCheckout = [];
  const completedCheckout = [];

  rows.forEach((row) => {
    const cr = row["Conversion rate"] || row["conversion_rate"] || 0;
    const crVal = typeof cr === "number" ? cr : parseFloat(cr) || 0;
    conv.push(parseFloat((crVal * 100).toFixed(2)));

    sessions.push(row["Sessions"] || 0);
    cartAdds.push(row["Sessions with cart additions"] || 0);
    reachedCheckout.push(row["Sessions that reached checkout"] || 0);
    completedCheckout.push(row["Sessions that completed checkout"] || 0);
  });

  return { conv, sessions, cartAdds, reachedCheckout, completedCheckout };
}

// Parse AOV CSV
function parseAOV(rows) {
  const aov = [];
  const aovPrior = [];
  const orders = [];

  rows.forEach((row) => {
    const a = row["Average order value"] || row["average_order_value"] || 0;
    const ap =
      row["Average order value (previous_period)"] ||
      row["average_order_value_previous_period"] ||
      0;
    const o = row["Orders"] || row["orders"] || 0;

    aov.push(
      typeof a === "number" ? a : parseFloat(String(a).replace(/[$,]/g, "")) || 0
    );
    aovPrior.push(
      typeof ap === "number" ? ap : parseFloat(String(ap).replace(/[$,]/g, "")) || 0
    );
    orders.push(typeof o === "number" ? o : parseInt(o) || 0);
  });

  return { aov, aovPrior, orders };
}

// Parse Sessions by Referrer CSV
function parseReferrers(rows) {
  return rows
    .filter((row) => row["Referrer"] || row["Referrer name"] || row["referrer"])
    .map((row) => {
      const name =
        row["Referrer"] || row["Referrer name"] || row["referrer"] || "Unknown";
      const s = row["Sessions"] || row["sessions"] || 0;
      const convRate =
        row["Conversion rate"] || row["conversion_rate"] || 0;
      const cr = typeof convRate === "number" ? convRate : parseFloat(convRate) || 0;
      return {
        n: name,
        s: typeof s === "number" ? s : parseInt(s) || 0,
        r: parseFloat((cr * 100).toFixed(2)),
      };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 10);
}

// Parse UTM Campaign CSV
function parseCampaigns(rows) {
  const channelColors = {
    Klaviyo: "#818CF8",
    Mailchimp: "#818CF8",
    "Attentive SMS": "#06B6D4",
    "Abandoned Cart": "#06B6D4",
    "Google Paid": "#F59E0B",
    "Facebook Paid": "#3B82F6",
    "Instagram Paid": "#EC4899",
  };

  const channels = {};

  rows.forEach((row) => {
    const source =
      row["UTM campaign source"] || row["utm_campaign_source"] || "";
    const medium =
      row["UTM campaign medium"] || row["utm_campaign_medium"] || "";

    let ch = source || medium || "Direct";
    if (source.toLowerCase().includes("klaviyo")) ch = "Klaviyo";
    else if (source.toLowerCase().includes("mailchimp")) ch = "Mailchimp";
    else if (source.toLowerCase().includes("attentive")) ch = "Attentive SMS";
    else if (medium.toLowerCase().includes("abandoned")) ch = "Abandoned Cart";
    else if (
      source.toLowerCase().includes("google") &&
      medium.toLowerCase().includes("paid")
    )
      ch = "Google Paid";
    else if (
      source.toLowerCase().includes("facebook") ||
      source.toLowerCase().includes("fb")
    )
      ch = "Facebook Paid";
    else if (source.toLowerCase().includes("instagram"))
      ch = "Instagram Paid";

    if (!channels[ch]) {
      channels[ch] = {
        ch: ch,
        se: 0,
        sa: 0,
        or: 0,
        cv: 0,
        cl: channelColors[ch] || "#6B7280",
      };
    }

    channels[ch].se += row["Sessions"] || 0;
    channels[ch].sa += row["Net sales"] || row["net_sales"] || 0;
    channels[ch].or += row["Orders"] || row["orders"] || 0;
  });

  return Object.values(channels)
    .map((c) => {
      c.cv = c.se > 0 ? parseFloat(((c.or / c.se) * 100).toFixed(1)) : 0;
      return c;
    })
    .sort((a, b) => b.sa - a.sa);
}

// Main: Transform all CSVs from a store folder into the dashboard data structure
function transformStoreData(files) {
  const salesCSV = findCSV(files, "net_sales_over_time");
  const convCSV = findCSV(files, "conversion_rate_over_time");
  const aovCSV = findCSV(files, "average_order_value");
  const refCSV = findCSV(files, "sessions_by_referrer");
  const utmCSV = findCSV(files, "performance_by_utm");

  const salesData = parseSales(salesCSV);
  const convData = parseConversion(convCSV);
  const aovData = parseAOV(aovCSV);
  const refData = parseReferrers(refCSV);
  const utmData = parseCampaigns(utmCSV);

  return {
    s: salesData.sales,
    sp: salesData.salesPrior,
    cv: convData.conv,
    se: convData.sessions,
    ca: convData.cartAdds,
    rc: convData.reachedCheckout,
    ck: convData.completedCheckout,
    av: aovData.aov,
    ap: aovData.aovPrior,
    or: aovData.orders,
    rf: refData,
    ut: utmData,
  };
}

// Transform all 3 stores
export function transformAllStores(rawData) {
  const result = {};
  const storeKeys = ["cp", "nb", "n4"];

  storeKeys.forEach((key) => {
    if (rawData[key]) {
      result[key] = transformStoreData(rawData[key]);
    }
  });

  // Build month labels from the first store's sales CSV
  const firstStore = rawData[storeKeys[0]];
  if (firstStore) {
    const salesKey = Object.keys(firstStore).find((name) =>
      name.toLowerCase().includes("net_sales_over_time")
    );
    if (salesKey) {
      const rows = parseCSV(firstStore[salesKey]);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      result.months = rows.map((row) => {
        const d = new Date(row["Month"] || row["month"] || "");
        if (isNaN(d.getTime())) return "???";
        return months[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
      });
    }
  }

  result.lastUpdated = new Date().toISOString();
  return result;
}

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

// Find a CSV by partial filename match (handles both underscores and spaces)
function findCSV(files, pattern) {
  const normalizedPattern = pattern.toLowerCase().replace(/[_ ]+/g, " ");
  const key = Object.keys(files).find((name) => {
    const normalizedName = name.toLowerCase().replace(/[_ ]+/g, " ");
    return normalizedName.includes(normalizedPattern);
  });
  if (!key) {
    console.log(`[CSV] No file matched pattern "${pattern}" among: ${Object.keys(files).join(', ')}`);
  } else {
    console.log(`[CSV] Matched "${pattern}" → "${key}"`);
  }
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

// Parse conversion rate CSV — includes funnel stages + traffic metrics
function parseConversion(rows) {
  // Debug: log actual column headers from first row
  if (rows.length > 0) {
    console.log("[CSV-DEBUG] Conversion CSV columns:", JSON.stringify(Object.keys(rows[0])));
    console.log("[CSV-DEBUG] First row values:", JSON.stringify(rows[0]));
  }
  const conv = [];
  const sessions = [];
  const cartAdds = [];
  const reachedCheckout = [];
  const completedCheckout = [];
  // Traffic metrics
  const addToCartRate = [];
  const checkoutConvRate = [];
  const pageviewsPerSession = [];
  const bounceRate = [];
  const avgSessionDuration = [];
  // Previous period
  const sessionsPrev = [];
  const completedCheckoutPrev = [];
  const convPrev = [];
  const addToCartRatePrev = [];
  const checkoutConvRatePrev = [];
  const pageviewsPerSessionPrev = [];
  const bounceRatePrev = [];
  const avgSessionDurationPrev = [];

  rows.forEach((row) => {
    // Helper to get numeric value, handling percentage decimals
    function gv(key, pctMult) {
      var v = row[key];
      if (v === undefined || v === null || v === "") return 0;
      var n = typeof v === "number" ? v : parseFloat(String(v).replace(/[%,]/g, "")) || 0;
      return pctMult ? parseFloat((n * 100).toFixed(2)) : n;
    }

    const cr = row["Conversion rate"] || row["conversion_rate"] || 0;
    const crVal = typeof cr === "number" ? cr : parseFloat(cr) || 0;
    conv.push(parseFloat((crVal * 100).toFixed(2)));

    sessions.push(row["Sessions"] || 0);
    cartAdds.push(row["Sessions with cart additions"] || 0);
    reachedCheckout.push(row["Sessions that reached checkout"] || 0);
    completedCheckout.push(row["Sessions that completed checkout"] || 0);

    // Traffic metrics
    var acr = row["Added to cart rate"] || 0;
    addToCartRate.push(typeof acr === "number" ? parseFloat((acr * 100).toFixed(2)) : parseFloat(acr) || 0);

    var ccr = row["Checkout conversion rate"] || 0;
    checkoutConvRate.push(typeof ccr === "number" ? parseFloat((ccr * 100).toFixed(2)) : parseFloat(ccr) || 0);

    pageviewsPerSession.push(row["Pageviews per session"] || 0);

    var br = row["Bounce rate"] || 0;
    bounceRate.push(typeof br === "number" ? parseFloat((br * 100).toFixed(2)) : parseFloat(br) || 0);

    avgSessionDuration.push(row["Average session duration"] || 0);

    // Previous period
    sessionsPrev.push(row["Sessions (previous_period)"] || 0);
    completedCheckoutPrev.push(row["Sessions that completed checkout (previous_period)"] || 0);

    var crp = row["Conversion rate (previous_period)"] || 0;
    convPrev.push(typeof crp === "number" ? parseFloat((crp * 100).toFixed(2)) : parseFloat(crp) || 0);

    var acrp = row["Added to cart rate (previous_period)"] || 0;
    addToCartRatePrev.push(typeof acrp === "number" ? parseFloat((acrp * 100).toFixed(2)) : parseFloat(acrp) || 0);

    var ccrp = row["Checkout conversion rate (previous_period)"] || 0;
    checkoutConvRatePrev.push(typeof ccrp === "number" ? parseFloat((ccrp * 100).toFixed(2)) : parseFloat(ccrp) || 0);

    pageviewsPerSessionPrev.push(row["Pageviews per session (previous_period)"] || 0);

    var brp = row["Bounce rate (previous_period)"] || 0;
    bounceRatePrev.push(typeof brp === "number" ? parseFloat((brp * 100).toFixed(2)) : parseFloat(brp) || 0);

    avgSessionDurationPrev.push(row["Average session duration (previous_period)"] || 0);
  });

  return {
    conv, sessions, cartAdds, reachedCheckout, completedCheckout,
    addToCartRate, checkoutConvRate, pageviewsPerSession, bounceRate, avgSessionDuration,
    sessionsPrev, completedCheckoutPrev, convPrev, addToCartRatePrev, checkoutConvRatePrev,
    pageviewsPerSessionPrev, bounceRatePrev, avgSessionDurationPrev
  };
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
    // Traffic metrics
    acr: convData.addToCartRate,
    ccr: convData.checkoutConvRate,
    pvs: convData.pageviewsPerSession,
    br: convData.bounceRate,
    asd: convData.avgSessionDuration,
    // Previous period traffic
    sep: convData.sessionsPrev,
    ckp: convData.completedCheckoutPrev,
    cvp: convData.convPrev,
    acrp: convData.addToCartRatePrev,
    ccrp: convData.checkoutConvRatePrev,
    pvsp: convData.pageviewsPerSessionPrev,
    brp: convData.bounceRatePrev,
    asdp: convData.avgSessionDurationPrev,
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
      name.toLowerCase().replace(/[_ ]+/g, " ").includes("net sales over time")
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

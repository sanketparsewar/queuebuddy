const url = import.meta.env.VITE_APP_URL;

// Extract the brand name from the URL
export const brandName = new URL(url).hostname.split(".")[0];

// Brand name with camel caseing
export const BRANDNAME = "Scan2Queue";

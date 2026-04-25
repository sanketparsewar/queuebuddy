const url = import.meta.env.VITE_APP_URL;

// Extract the brand name from the URL
const hostnameParts = new URL(url).hostname.split(".");
export const product_name =
  hostnameParts[0] === "www" ? hostnameParts[1] : hostnameParts[0];

// Brand name with camel caseing
export const PRODUCT_NAME = "QueueBuddy";

export const COMPANY_NAME_TM = "Daxabit™";
export const COMPANY_NAME = "Daxabit";


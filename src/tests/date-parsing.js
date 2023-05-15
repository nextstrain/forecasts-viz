import { datesArray } from "../lib/utils/parse.js";

/**
 * I initially tried to implement the following in jest
 * (the default test platform included in CRA). We've had
 * issues with the complexity of Jest in the past and this
 * was no exception -- setting the TZ via process.env.TZ
 * wasn't respected by Jest. Instead of finding another
 * JS test platform, I chose to just implement a bunch
 * of assertions.                           james, may 2023
 */


const testData = [
  {dates: ["2023-03-10", "2023-03-15"], days: 6, years: 1, comment: 'Bridges over the PST -> PDT TZ change'},
  {dates: ["2023-11-04", "2023-11-06"], days: 3, years: 1, comment: 'Bridges over the PDT -> PST TZ change'},
  {dates: ["2023-04-01", "2023-04-05"], days: 5, years: 1, comment: 'Bridges over the NZDT -> NZST TZ change'},
  {dates: ["2023-09-23", "2023-09-25"], days: 3, years: 1, comment: 'Bridges over the NZST -> NZDT TZ change'},
  {dates: ["2023-01-01", "2023-12-31"], days: 365, years: 1, comment: 'Not a leap year'},
  {dates: ["2024-01-01", "2024-12-31"], days: 366, years: 1, comment: 'Leap year'},
]
const zones = [
  "America/Los_Angeles", // PST + PDT
  "PST", "PDT",
  "Pacific/Auckland", // NZST / NZDT
  "NZST", "NZDT",
  "UDT",
]

let testsFailed = false;

for (const d of testData) {
  for (const tz of zones) {
    process.env.TZ = tz;
    const dates = datesArray(...d.dates);
    const n = (new Set(dates)).size
    if (n!==d.days) {
      testsFailed = true;
      console.log(`ERROR. TZ=${process.env.TZ}. Date mismatch ${n} vs ${d.days}. ${d.comment}`)
    }
    const years = new Set(dates.map((x) => x.slice(0, 4)));
    if (years.size!==d.years) {
      testsFailed = true;
      console.log(`ERROR. TZ=${process.env.TZ}. Dates covered ${years.size} years not ${d.years}. ${d.comment}`)
    }
    if (dates[0] !== d.dates[0]) {
      testsFailed = true;
      console.log(`ERROR. TZ=${process.env.TZ}. Start date ${dates[0]} vs ${d.dates[0]}. ${d.comment}`)
    }
    if (dates[dates.length-1] !== d.dates[1]) {
      testsFailed = true;
      console.log(`ERROR. TZ=${process.env.TZ}. End date ${dates[dates.length-1]} vs ${d.dates[1]}. ${d.comment}`)
    }
  }
}


if (testsFailed) {
  process.exit(2);
}

import { writeFile } from "fs/promises";
import https from "https";

const AIRPORTS_URL =
  "https://raw.githubusercontent.com/jpatokal/openflights/refs/heads/master/data/airports.dat";

const fetchCsv = (): Promise<string> =>
  new Promise((resolve, reject) => {
    https.get(AIRPORTS_URL, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch: ${res.statusCode}`));
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

interface Airport {
  iata: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
}

async function run() {
  const csv = await fetchCsv();
  const lines = csv.trim().split("\n");

  const airports: Airport[] = lines
    .map((line) => {
      const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());

      const iata = parts[4];
      const lat = parseFloat(parts[6]);
      const lng = parseFloat(parts[7]);

      if (!iata || iata === "\\N" || isNaN(lat) || isNaN(lng)) return null;

      return {
        iata,
        lat,
        lng,
        name: parts[1],
        city: parts[2],
        country: parts[3],
      };
    })
    .filter(Boolean) as Airport[];

  await writeFile("airports.json", JSON.stringify(airports, null, 2));
  console.log(`✔️ Saved ${airports.length} entries to airports.json`);
}

run().catch((err) => {
  console.error("❌ Failed:", err);
});
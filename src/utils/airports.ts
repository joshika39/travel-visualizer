import airportData from "@/assets/airports.json";
import {Airport} from "@/types";

const airportMap = new Map<string, Airport>(
  airportData.map(a => [a.iata.toUpperCase(), a])
);

export function getAirport(iata: string): Airport | null {
  return airportMap.get(iata.toUpperCase()) || null;
}
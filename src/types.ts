
export type Feature = {
  type: string;
  properties: {
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
}

export type GeoData = {
  type: string;
  features: Feature[];
}

export interface RawAirportCsvRow {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  lat: string;
  lng: string;
  altitude: string;
  timezone: string;
  dst: string;
  tzDatabaseTimeZone: string;
  type: string;
  source: string;
}

export interface Airport {
  iata: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
}
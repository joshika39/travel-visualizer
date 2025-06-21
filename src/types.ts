
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
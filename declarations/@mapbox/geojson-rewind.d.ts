declare module "@mapbox/geojson-rewind" {
  // eslint-disable-next-line import/no-default-export
  export default function rewind<T>(geojson: T, clockwise?: boolean): T;
}

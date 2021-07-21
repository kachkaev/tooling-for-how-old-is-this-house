export type OmitNulls<T> = {
  [P in keyof T]: Exclude<T[P], null>;
};

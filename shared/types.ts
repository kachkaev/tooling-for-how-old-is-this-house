export type OmitNullable<T> = {
  [P in keyof T]: Exclude<T[P], null | undefined>;
};

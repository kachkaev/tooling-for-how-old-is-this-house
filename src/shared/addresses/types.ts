export type Gender = "m" | "f";

export interface GenericDesignationConfig {
  normalizedName: string;
  aliases: string[];
  gender: Gender;
}

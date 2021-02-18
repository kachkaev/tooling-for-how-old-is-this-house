export type Gender = "m" | "f";

export interface DesignationConfig {
  normalizedName: string;
  aliases: string[];
  gender: Gender;
}

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: string[];
}

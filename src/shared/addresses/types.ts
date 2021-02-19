export type Gender = "m" | "f" | "n";

export interface DesignationConfig {
  normalizedName: string;
  aliases: string[];
  gender: Gender;
}

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: string[];
}

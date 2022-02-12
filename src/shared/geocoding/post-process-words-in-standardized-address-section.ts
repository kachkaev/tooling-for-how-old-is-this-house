import { PostProcessWordsInStandardizedAddressSection } from "../addresses";

export const postProcessWordsInStandardizedAddressSection: // https://github.com/prettier/prettier/issues/11923
PostProcessWordsInStandardizedAddressSection = (words) =>
  words.filter(
    (word) =>
      !(
        // Remove ordinal number if it is 1.
        // When geocoding, "1-й такой-то переулок" === "такой-то переулок".
        (
          (word.wordType === "ordinalNumber" &&
            word.number === 1 &&
            words.length > 2) ||
          // Remove initials
          // In the context of geocoding, "улица А. С. Пушкина" === "улица А. Пушкина" === "улица Пушкина".
          word.wordType === "initial"
        )
      ),
  );

/**
 * Some entries in Rosreestr have a broken encoding, which is not fully recoverable.
 * This function helps avoid usage of this data.
 */
export const validateCyrillic = (input: string): boolean =>
  !/[µЂЃЉЏѓїћўҐ]/.test(input);

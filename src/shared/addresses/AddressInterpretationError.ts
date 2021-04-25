/**
 * This error is thrown when cleaned address cannot be standardized.
 * Using a separate error type helps keep distinguish expected behaviour from runtime errors.
 */
export class AddressInterpretationError extends Error {
  constructor(...args: any[]) {
    super(...args);
    Object.setPrototypeOf(this, AddressInterpretationError.prototype);
  }
}

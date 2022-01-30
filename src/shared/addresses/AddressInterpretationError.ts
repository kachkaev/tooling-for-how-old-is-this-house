/**
 * This error is thrown when cleaned address cannot be standardized.
 * Using a separate error type helps keep distinguish expected behaviour from runtime errors.
 */
export class AddressInterpretationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AddressInterpretationError.prototype);
  }
}

/**
 * Standardized error handling utilities.
 * Eliminates the need for 'any' types in catch blocks across route handlers.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Ralat tidak diketahui berlaku.';
}

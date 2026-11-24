/**
 * MFC Enterprise Foundation Framework - Standard REST API Message Dictionary
 * Sesuai panduan standar respons dan validasi MFC.
 */

export const ApiMessages = {
  // API Key Dictionary
  apiKeyRequired: 'API Key is required',
  invalidApiKey: 'Invalid API Key',

  // Parameter Validation Dictionary
  parameterMissing: (param: string) => `Required parameter ${param} is missing`,
  parameterRequired: (param: string) => `The parameter ${param} field is required.`,
  parameterNotFound: (param: string) => `${param} not found`,
  parameterFound: (param: string) => `${param} found`,

  // Authentication & Access Control
  unauthorized: 'Authentication required: Invalid or expired token',
  forbidden: (pageOrAction = 'page') => `Access forbidden: You do not have permission to access ${pageOrAction}`,
  passwordBypassSuccess: 'Password bypass authentication granted for developer session',
  
  // Rate Limiting
  rateLimitExceeded: 'Too many requests. Please try again later.',

  // Generic Operations
  success: 'Operation completed successfully',
  created: 'Resource created successfully',
  updated: 'Resource updated successfully',
  deleted: 'Resource deleted successfully',
  internalError: 'Internal server error occurred. Please contact system administrator.',
} as const;

export type ApiMessageType = typeof ApiMessages;

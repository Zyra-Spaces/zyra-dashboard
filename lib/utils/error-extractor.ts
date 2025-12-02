/**
 * Utility to extract error information from various error types
 * Handles Supabase errors, PostgrestError, and standard Error objects
 */

export interface ExtractedError {
  code: string | number | null;
  message: string;
  details: string | null;
  hint: string | null;
  originalError: any;
  errorType: string;
  errorConstructor: string | undefined;
}

/**
 * Extract error information from any error object
 */
export function extractErrorInfo(error: any): ExtractedError {
  if (!error) {
    return {
      code: null,
      message: 'Unknown error',
      details: null,
      hint: null,
      originalError: error,
      errorType: 'null',
      errorConstructor: undefined,
    };
  }

  // Try to extract code from various possible locations
  const code = 
    error.code || 
    error.status || 
    error.statusCode || 
    (error.response && error.response.status) ||
    (error.response && error.response.data && error.response.data.code) ||
    null;

  // Try to extract message from various possible locations
  const message = 
    error.message || 
    error.details || 
    error.hint ||
    (error.response && error.response.data && error.response.data.message) ||
    (error.response && error.response.statusText) ||
    String(error) ||
    'Unknown error';

  // Extract details and hint
  const details = 
    error.details || 
    (error.response && error.response.data && error.response.data.details) ||
    null;

  const hint = 
    error.hint || 
    (error.response && error.response.data && error.response.data.hint) ||
    null;

  return {
    code,
    message,
    details,
    hint,
    originalError: error,
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
  };
}

/**
 * Get all properties from an error object for debugging
 */
export function getErrorDebugInfo(error: any): Record<string, any> {
  const info: Record<string, any> = {
    errorString: String(error),
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
  };

  if (!error || typeof error !== 'object') {
    return info;
  }

  try {
    // Get own properties
    info.errorKeys = Object.keys(error);
    info.errorOwnProps = Object.getOwnPropertyNames(error);

    // Try to get each property
    Object.getOwnPropertyNames(error).forEach(prop => {
      try {
        info[`_${prop}`] = (error as any)[prop];
      } catch (e) {
        info[`_${prop}`] = '[Unable to access]';
      }
    });

    // Try to get from prototype
    if (Object.getPrototypeOf(error)) {
      const protoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(error));
      protoProps.forEach(prop => {
        if (prop !== 'constructor') {
          try {
            info[`_proto_${prop}`] = (error as any)[prop];
          } catch (e) {
            // Ignore
          }
        }
      });
    }

    // Check for response object (HTTP errors)
    if (error.response) {
      info.responseStatus = error.response.status;
      info.responseStatusText = error.response.statusText;
      info.responseData = error.response.data;
    }

    // Check for request object
    if (error.request) {
      info.hasRequest = true;
    }
  } catch (e) {
    info.extractionError = String(e);
  }

  return info;
}








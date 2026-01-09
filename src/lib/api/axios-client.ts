import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';


export interface ApiFieldError {
    field: string;
    message: string;
}

export interface ApiNestedError {
    code?: string;
    message?: string;
    errors?: ApiFieldError[];
    details?: unknown;
}

export interface ApiErrorResponse {
    error?: string | ApiNestedError;
    message?: string;
    detail?: string;
    errors?: Record<string, string[]> | ApiFieldError[];
    code?: string;
    status?: number;
    success?: boolean;
};

// Parsed error with user-friendly message
export interface ParsedApiError { 
    message: string;
    code: string;
    status: number;
    fieldErrors: Record<string, string[]>;
    validationErrors: ApiFieldError[];
    isNetworkError: boolean;
    isServerError: boolean;
    isClientError: boolean;
    isValidationError: boolean;
    raw: AxiosError<ApiErrorResponse>;
};


// Session storage key and header name
const SESSION_STORAGE_KEY = 'konvrt_session_id';
const SESSION_HEADER_NAME = 'X-Session-ID';


function getBaseUrl(): string { 
    const envUrl = process.env.NEXT_PUBLIC_API_URL;

    if (envUrl) { 
        return envUrl.replace(/\/$/, ''); // Remove trailing slashes
    };

    return 'http://localhost:8000/api/v1';
};

const DEFAULT_TIMEOUT = 30000;
export const UPLOAD_TIMEOUT = 5 * 60 * 1000;


/**
 * Get the stored session ID from localStorage.
 * Returns null if not found or if localStorage is unavailable.
 */
function getStoredSessionId(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    
    try {
        return localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
        return null;
    }
}


/**
 * Store the session ID in localStorage.
 */
function storeSessionId(sessionId: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {
        console.warn('[API] Unable to store session ID in localStorage');
    }
}


/**
 * Clear the stored session ID.
 */
export function clearStoredSessionId(): void {
    if (typeof window === 'undefined') {
        return;
    }
    
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // Ignore errors
    }
}


function extractValidationErrors(data: ApiErrorResponse | undefined): ApiFieldError[] {
    if (!data) return [];
    
    // Check for nested error object with errors array
    if (data.error && typeof data.error === 'object') {
        const nestedError = data.error as ApiNestedError;
        if (Array.isArray(nestedError.errors)) {
            return nestedError.errors.filter(
                (e): e is ApiFieldError => 
                    e && typeof e === 'object' && typeof e.message === 'string'
            );
        }
    }
    
    // Check for top-level errors array
    if (Array.isArray(data.errors)) {
        return data.errors.filter(
            (e): e is ApiFieldError => 
                e && typeof e === 'object' && typeof e.message === 'string'
        );
    }
    
    return [];
}


// Extract the most appropriate error message from various error formats
function extractErrorMessage(data: ApiErrorResponse | undefined): string { 
    if (!data) return 'An unknown error occurred.';

    const validationErrors = extractValidationErrors(data);
    if (validationErrors.length > 0) {
        return validationErrors[0].message;
    }

    if (typeof data.message === 'string' && data.message) return data.message;
    
    if (typeof data.detail === 'string' && data.detail) return data.detail;
    
    if (data.error) {
        if (typeof data.error === 'string') {
            return data.error;
        }
        if (typeof data.error === 'object' && data.error.message) {
            return data.error.message;
        }
    }

    if (data.errors && !Array.isArray(data.errors) && Object.keys(data.errors).length > 0) { 
        const errorsRecord = data.errors as Record<string, string[]>;
        const firstField = Object.keys(errorsRecord)[0];
        const firstError = errorsRecord[firstField]?.[0];
        if (firstError) {
            return `${firstField}: ${firstError}`;
        }
    };

    return 'An unknown error occurred.';
};

// Extract field-specific errors into a Record format
function extractFieldErrors(
  data: ApiErrorResponse | undefined
): Record<string, string[]> {
    if (!data) return {};
    
    const validationErrors = extractValidationErrors(data);
    if (validationErrors.length > 0) {
        const result: Record<string, string[]> = {};
        for (const err of validationErrors) {
            const field = err.field || 'general';
            if (!result[field]) {
                result[field] = [];
            }
            result[field].push(err.message);
        }
        return result;
    }
    
    if (data.errors && !Array.isArray(data.errors)) {
        return data.errors;
    }
    
    return {};
};


// Parse the Axios error into a structured format
export function parseApiError(error: AxiosError<ApiErrorResponse>): ParsedApiError { 
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    const validationErrors = extractValidationErrors(data);
    
    // Check if this is a validation error
    let code = data?.code ?? error.code ?? 'UNKNOWN_ERROR';
    if (data?.error && typeof data.error === 'object') {
        code = (data.error as ApiNestedError).code ?? code;
    }
    const isValidationError = code === 'VALIDATION_ERROR' || status === 400;

    return {
        message: extractErrorMessage(data),
        code,
        status,
        fieldErrors: extractFieldErrors(data),
        validationErrors,
        isNetworkError: !error.response && error.code === 'ERR_NETWORK',
        isServerError: status >= 500,
        isClientError: status >= 400 && status < 500,
        isValidationError,
        raw: error,
    };
};


export function isAxiosError(
  error: unknown
): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error);
};


// Get a user-friendly error message from any error
export function getErrorMessage(error: unknown): string { 
    if (isAxiosError(error)) {
        const parsed = parseApiError(error);

        switch (parsed.status) {
          case 0:
            return "Unable to connect to the server. Please check your internet connection.";
          case 400:
            return (
              parsed.message || "Invalid request. Please check your input."
            );
          case 401:
            return "Your session has expired. Please refresh the page.";
          case 403:
            return "You do not have permission to perform this action";
          case 404:
            return "The requested resource was not found.";
          case 408:
            return "The request timed out. Please try again.";
          case 413:
            return "The file is too large to upload.";
          case 429:
            return "Too many requests. Please wait a moment and try again.";
          case 500:
            return "A server error occurred. Please try again later.";
          case 502:
          case 503:
          case 504:
            return "The service is temporarily unavailable. Please try again later.";
          default:
            return parsed.message;
        };
    };

    if (error instanceof Error) { 
        return error.message;
    };

    return 'An unexpected error occurred';
};


// Create and configure the Axios instance
function createAxiosClient(): AxiosInstance { 
    const client = axios.create({
        baseURL: getBaseUrl(),
        timeout: DEFAULT_TIMEOUT,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            };
            const storedSessionId = getStoredSessionId();
            if (storedSessionId) {
                config.headers[SESSION_HEADER_NAME] = storedSessionId;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
                if (storedSessionId) {
                    console.log(`[API] Using stored session: ${storedSessionId.substring(0, 8)}...`);
                }
            };

            return config;
        },
        (error: AxiosError) => {
            if (process.env.NODE_ENV === 'development') {
                console.error('[API] Request error:', error.message);
            };
            return Promise.reject(error);
        }
    );

    // Response interceptor - capture session ID from response headers
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            const sessionId = response.headers[SESSION_HEADER_NAME.toLowerCase()];
            if (sessionId && typeof sessionId === 'string') {
                const currentStoredId = getStoredSessionId();
                if (sessionId !== currentStoredId) {
                    storeSessionId(sessionId);
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[API] Stored new session ID: ${sessionId.substring(0, 8)}...`);
                    }
                }
            }

            if (process.env.NODE_ENV === 'development') {
                console.log(`[API] Response ${response.status} from ${response.config.url}`);
            }
            return response;
        },
        (error: AxiosError<ApiErrorResponse>) => {
            if (process.env.NODE_ENV === 'development') {
                console.error("[API] Response Error:", {
                    url: error.config?.url,
                    status: error.response?.status,
                    message: error.message,
                    data: error.response?.data,
                });
            };

            if (error.response?.headers) {
                const sessionId = error.response.headers[SESSION_HEADER_NAME.toLowerCase()];
                if (sessionId && typeof sessionId === 'string') {
                    storeSessionId(sessionId);
                }
            }

            if (error.code === 'ECONNABORTED') {
                console.error('[API] Request timed out:', error.config?.url);
            };

            if (error.code === 'ERR_NETWORK') {
                console.error('[API] Network error - server may be down')
            };

            return Promise.reject(error);
        }
    );

    return client;
};


export const apiClient = createAxiosClient();
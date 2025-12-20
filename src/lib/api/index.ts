// src/lib/api/index.ts

export {
    apiClient,
    parseApiError,
    isAxiosError,
    getErrorMessage,
    UPLOAD_TIMEOUT
} from './axios-client';

export type { ApiErrorResponse, ParsedApiError } from './axios-client';

export {
    checkHealth,
    testConnection,
    waitForBackend,
    checkServices,
    ping,
} from './health';

export type { HealthCheckResponse, ConnectionStatus } from './health';
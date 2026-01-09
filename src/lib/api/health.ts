import { apiClient, getErrorMessage } from './axios-client';

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version?: string;
    services?: {
        database: 'connected' | 'disconnected';
        redis: 'connected' | 'disconnected';
        storage: 'available' | 'unavailable';
    };
};

export interface ConnectionStatus {
    connected: boolean;
    latencyMs: number;
    healthData: HealthCheckResponse | null;
    error: string | null;
};


export async function checkHealth(): Promise<HealthCheckResponse> {
    const response = await apiClient.get<HealthCheckResponse>('/health/');
    return response.data;
};

export async function testConnection(): Promise<ConnectionStatus> { 
    const startTime = performance.now();

    try {
        const healthData = await checkHealth();
        const latencyMs = Math.round(performance.now() - startTime);

        return {
            connected: true,
            latencyMs,
            healthData,
            error: null,
        };
    } catch (error) { 
        const latencyMs = Math.round(performance.now() - startTime);
        const errorMessage = getErrorMessage(error);

        return { 
            connected: false,
            latencyMs,
            healthData: null,
            error: errorMessage,
        };
    };
};


export async function waitForBackend(
  maxAttempts: number = 10,
  intervalMs: number = 2000,
  onAttempt?: (attempt: number, maxAttempts: number) => void
): Promise<ConnectionStatus> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Call the optional callback
    if (onAttempt) {
      onAttempt(attempt, maxAttempts);
    }

    const status = await testConnection();

    if (status.connected) {
      return status;
    }

    lastError = status.error;

    // Don't wait after the last attempt
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(lastError ?? "Failed to connect to backend");
};


export async function checkServices(): Promise<{
  database: boolean;
  redis: boolean;
  storage: boolean;
  api: boolean;
}> {
  try {
    const health = await checkHealth();

    return {
      database: health.services?.database === "connected",
      redis: health.services?.redis === "connected",
      storage: health.services?.storage === "available",
      api: health.status === "healthy",
    };
  } catch {
    // If health check fails, all services are considered unavailable
    return {
      database: false,
      redis: false,
      storage: false,
      api: false,
    };
  }
};


export async function ping(): Promise<boolean> {
  try {
    await apiClient.head("/api/v1/health/", {
      timeout: 10000, // 10 second timeout for ping
    });
    return true;
  } catch {
    return false;
  }
}
/**
 * Cliente HTTP base para comunicação com o backend Node.js
 * Seguro: não armazena segredos no cliente, realiza chamadas relativas
 */

export class ApiClientError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) {
        errorMessage = errJson.message;
      }
    } catch {
      // Falha ao ler JSON de erro; mantém a mensagem de status HTTP
    }
    throw new ApiClientError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

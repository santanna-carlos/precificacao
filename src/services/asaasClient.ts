// src/services/asaasClient.ts
const ASAS_API_KEY = process.env.ASAS_API_KEY;
const ASAS_BASE_URL = 'https://www.asaas.com/api/v3';

export async function asaasRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${ASAS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAS_API_KEY!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}
// src/services/asaasClient.ts

const ASAS_API_KEY = import.meta.env.VITE_ASAS_API_KEY;
const ASAS_BASE_URL = 'http://localhost:4000/api/asaas';

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
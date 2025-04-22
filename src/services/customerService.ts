// src/services/customerService.ts
import { asaasRequest } from './asaasClient';

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
}

export async function createCustomer(data: CustomerData) {
  return asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
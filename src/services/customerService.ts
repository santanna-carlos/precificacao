// src/services/customerService.ts
import { asaasRequest } from './asaasClient';

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
  complement?: string;
}

export async function createCustomer(data: CustomerData) {
  const response = await asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response;
}

// src/services/paymentService.ts
import { asaasRequest } from './asaasClient';

interface PaymentData {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  value: number;
  dueDate: string; // formato 'YYYY-MM-DD'
  description?: string;
  successUrl: string;
}

export async function createPayment(data: PaymentData) {
  const payload = {
    customer: data.customer,
    billingType: data.billingType,
    value: data.value,
    dueDate: data.dueDate,
    description: data.description,
    callback: {
      successUrl: data.successUrl,
      autoRedirect: true,
    },
  };

  return asaasRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

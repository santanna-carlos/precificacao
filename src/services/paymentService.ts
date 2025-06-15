// src/services/paymentService.ts

import { asaasRequest } from './asaasClient';

interface CreatePaymentData {
  customer: string;
  value: number;
  dueDate: string; // no formato "YYYY-MM-DD"
  successUrl: string;
}

export async function createPayment({ customer, value, dueDate, successUrl }: CreatePaymentData) {
  const payload = {
    customer,
    billingType: 'CREDIT_CARD',  // pode mudar para BOLETO ou PIX
    value,
    dueDate,
    callback: {
      successUrl,
      autoRedirect: true,
    },
  };

  const response = await asaasRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response;
}

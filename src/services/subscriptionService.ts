// src/services/subscriptionService.ts
import { asaasRequest } from './asaasClient';

interface SubscriptionData {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  value: number;
  cycle: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  nextDueDate: string; // formato 'YYYY-MM-DD'
  description?: string;
}

export async function createSubscription(data: SubscriptionData) {
  return asaasRequest('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
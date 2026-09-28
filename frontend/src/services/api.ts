import type {
  SupportApiResponse,
  CustomerMemoryResponse,
  HealthResponse,
} from '../types';

/**
 * Base URL for the MemoryDesk backend API.
 * Defaults to empty string (relying on Vite proxy in development).
 * Can be configured via VITE_API_BASE_URL in production environments.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://memorydesk-movesphere.onrender.com' : '');

export const api = {
  /**
   * Health check to monitor backend availability and status.
   */
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Retrieve persistent memories stored for a customer.
   */
  async getCustomerMemories(customerId: string): Promise<CustomerMemoryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/support/memories/${encodeURIComponent(customerId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch memories (${res.status})`);
    }
    return res.json();
  },

  /**
   * Send customer message and receive reasoned support response with recalled memories.
   */
  async sendMessage(customerId: string, message: string): Promise<SupportApiResponse> {
    const res = await fetch(`${API_BASE_URL}/api/support/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        message,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }
    return res.json();
  },

  /**
   * Reset active working case state for fresh dialogue session.
   */
  async resetCase(customerId: string): Promise<{ status: string; customerId: string }> {
    const res = await fetch(`${API_BASE_URL}/api/support/reset/${encodeURIComponent(customerId)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Reset failed with status ${res.status}`);
    }
    return res.json();
  },
};

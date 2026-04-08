import { Batch, BatchListResponse } from './types';

const API_BASE = 'https://api.doubleword.ai/v1';

export class BatchService {
  constructor(private readonly apiKey: string) {}

  async fetchBatches(limit: number): Promise<Batch[]> {
    const url = `${API_BASE}/batches?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 401:
          throw new Error('Invalid API key. Check your DOUBLEWORD_API_KEY or dwm.apiKey setting.');
        case 429:
          throw new Error('Rate limited by doubleword.ai. Try again shortly.');
        default:
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    const body = (await response.json()) as BatchListResponse;
    return body.data;
  }
}

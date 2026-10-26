import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, ApiClientError } from '@/lib/api/client';

describe('Super Admin API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs a GET request with credentials include and parses data successfully', async () => {
    const mockData = { id: 'admin-123', email: 'admin@reviewflow.com', role: 'super_admin' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockData }),
    });
    global.fetch = fetchMock;

    const result = await apiFetch('/admin/me');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/admin/me');
    expect(init?.credentials).toBe('include');
    expect(init?.method).toBe('GET');
    expect(result).toEqual(mockData);
  });

  it('attaches CSRF token on state-changing requests when csrf_token cookie exists', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=test-csrf-token-xyz; other=val',
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { status: 'paused' } }),
    });
    global.fetch = fetchMock;

    await apiFetch('/admin/promotions/FREE4YOU/pause', {
      method: 'POST',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers['x-csrf-token']).toBe('test-csrf-token-xyz');
  });

  it('throws ApiClientError with code and status when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        },
      }),
    });
    global.fetch = fetchMock;

    await expect(apiFetch('/admin/overview')).rejects.toThrow(ApiClientError);
    await expect(apiFetch('/admin/overview')).rejects.toThrow(
      'You do not have permission to perform this action.',
    );
  });
});

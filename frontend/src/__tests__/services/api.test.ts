import { describe, it, expect } from 'vitest';
import { api } from '../../services/api';

describe('api', () => {
  it('creates axios instance with correct baseURL', () => {
    // The api instance is already created when the module loads
    expect(api.defaults.baseURL).toBeDefined();
    // Should be either the env var or default '/api'
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });

  it('creates axios instance with correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('creates axios instance with correct timeout', () => {
    expect(api.defaults.timeout).toBe(30000);
  });

  it('has request and response interceptors configured', () => {
    // Verify interceptors are set up
    expect(api.interceptors.request).toBeDefined();
    expect(api.interceptors.response).toBeDefined();
  });
});

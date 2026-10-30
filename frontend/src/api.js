/**
 * api.js — Centralized API client for FruitQualityAI backend
 * Base URL: http://127.0.0.1:8000
 *
 * Endpoints:
 *   GET  /health                  — server liveness
 *   GET  /api/fruits/status       — model availability
 *   POST /api/fruits/analyze      — image analysis (FormData: file)
 *   GET  /api/history/            — list inspections (?limit=N)
 *   GET  /api/analytics/summary   — aggregated stats
 */

const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Generic fetch wrapper with error normalisation.
 * Always returns { data, error }.
 */
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);

    if (!res.ok) {
      let message = `Server returned ${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        message = body.detail || body.message || message;
      } catch {
        // Non-JSON error body — use status text
      }
      return { data: null, error: message };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    // Network error (backend down, CORS, etc.)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return {
        data: null,
        error:
          'Cannot reach the backend server. Make sure the FastAPI server is running at http://127.0.0.1:8000',
      };
    }
    return { data: null, error: err.message || 'Unknown error' };
  }
}

/** GET /health */
export async function checkHealth() {
  return apiFetch('/health');
}

/** GET /api/fruits/status */
export async function getModelStatus() {
  return apiFetch('/api/fruits/status');
}

/**
 * POST /api/fruits/analyze
 * @param {File} file — the image file to analyse
 */
export async function analyzeImage(file) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/api/fruits/analyze', { method: 'POST', body: form });
}

/**
 * GET /api/history/
 * @param {number} limit — max records (1-200, default 50)
 */
export async function getHistory(limit = 50) {
  return apiFetch(`/api/history/?limit=${limit}`);
}

/** GET /api/analytics/summary */
export async function getAnalyticsSummary() {
  return apiFetch('/api/analytics/summary');
}

'use client';

import { getActiveProjectIdSnapshot } from '@/stores/dashboard-config';

type QueryParamScalar = number | string;
type QueryParamValue = QueryParamScalar | readonly QueryParamScalar[] | undefined;

interface ApiErrorResponse {
  error?: string;
}

function appendQueryParam(searchParams: URLSearchParams, key: string, value: QueryParamValue) {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return;
    }

    searchParams.set(key, value.join(','));
    return;
  }

  searchParams.set(key, String(value));
}

function buildQueryParams(params: Record<string, QueryParamValue>): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    appendQueryParam(searchParams, key, value);
  }

  return searchParams;
}

export function getProjectHeaders(projectId = getActiveProjectIdSnapshot()): HeadersInit {
  if (!projectId) return {};
  return { 'X-Trekker-Project-Id': projectId };
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const projectId = getActiveProjectIdSnapshot();
  if (projectId && !headers.has('X-Trekker-Project-Id')) {
    headers.set('X-Trekker-Project-Id', projectId);
  }

  return fetch(path, { ...init, headers });
}

export async function fetchQuery<T>(
  path: string,
  params: Record<string, QueryParamValue>,
  fallbackMessage: string
): Promise<T> {
  const searchParams = buildQueryParams(params);
  let url = path;
  const query = searchParams.toString();
  if (query.length > 0) {
    url = `${path}?${query}`;
  }

  const response = await apiFetch(url);
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.error || fallbackMessage);
  }

  return response.json();
}

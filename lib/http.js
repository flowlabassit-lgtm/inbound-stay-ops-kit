export async function fetchWithTimeout(url, options = {}) {
  const {
    fetchImpl = fetch,
    timeoutMs = 8_000,
    signal: _signal,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      ...fetchOptions,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

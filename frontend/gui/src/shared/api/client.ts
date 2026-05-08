export async function requestJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  // Some endpoints intentionally return an empty body.
  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

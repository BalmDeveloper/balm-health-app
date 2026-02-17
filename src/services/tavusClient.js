const TAVUS_API_KEY =
  process.env.EXPO_PUBLIC_TAVUS_API_KEY ??
  process.env.EXPO_PUBLIC_TARVUS_API_KEY;
const BASE_URL = 'https://tavusapi.com/v2';

function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (TAVUS_API_KEY) {
    headers['x-api-key'] = TAVUS_API_KEY;
  }

  return headers;
}

async function tavusRequest(path, { method = 'GET', body, headers } = {}) {
  if (!TAVUS_API_KEY) {
    throw new Error('Tavus API key not configured. Set EXPO_PUBLIC_TAVUS_API_KEY (or EXPO_PUBLIC_TARVUS_API_KEY) in your .env file.');
  }

  if (!path.startsWith('/')) {
    throw new Error('Tavus request path must start with /.');
  }

  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: buildHeaders(headers),
  };

  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavus request failed: ${response.status} ${response.statusText} — ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function fetchPersona(personaId) {
  if (!personaId) {
    throw new Error('Persona ID is required to fetch Tavus persona details.');
  }

  return tavusRequest(`/personas/${personaId}`);
}

export async function updatePersona(personaId, payload) {
  if (!personaId) {
    throw new Error('Persona ID is required to update Tavus persona.');
  }

  return tavusRequest(`/personas/${personaId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function createConversation(payload = {}) {
  return tavusRequest('/conversations', {
    method: 'POST',
    body: payload,
  });
}

export default {
  fetchPersona,
  updatePersona,
  createConversation,
};

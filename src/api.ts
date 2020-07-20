import fetch from "node-fetch";

const BASE_URL = `https://semgrep.live`;
const SNIPPET_URL = `/api/snippet`;

interface Snippet {
  pattern: string;
  language: string;
  target: string;
}

export interface SnippetResponse {
  id: string;
}

const CONTENT_TYPE_JSON = { "Content-Type": "application/json" };

async function apiRequest<B, RS>(
  method: string,
  path: string,
  body?: B
): Promise<RS> {
  const hasBody = body !== undefined;
  const headers = {
    Accept: "application/json",
    ...(hasBody ? CONTENT_TYPE_JSON : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "same-origin",
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw Error(
      `${method.toUpperCase()} ${path} ` +
        `returned ${response.status}:\n` +
        `${await response.text()}`
    );
  }
}

export const saveSnippet = (snippet: Snippet): Promise<SnippetResponse> => {
  return apiRequest<Snippet, SnippetResponse>("post", SNIPPET_URL, snippet);
};

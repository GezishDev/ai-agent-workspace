export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    is_active: boolean;
    created_at: string;
  };
};

export type AgentRun = {
  id: string;
  prompt: string;
  response: string;
  created_at: string;
  model: string;
  temperature: number;
  max_tokens: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    // If 204 No Content, response.json() fails, so return null/void
    if (response.status === 204) {
      return null as T;
    }
    const payload = await response.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(payload.detail ?? "Request failed.");
  }

  // Handle empty or 204 response
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json() as Promise<T>;
}

export const apiClient = {
  register(email: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  runAgent(prompt: string, token: string, model?: string, temperature?: number, maxTokens?: number) {
    return request<AgentRun>("/agents/runs", {
      method: "POST",
      token,
      body: JSON.stringify({ prompt, model, temperature, max_tokens: maxTokens })
    });
  },
  listAgentRuns(token: string) {
    return request<AgentRun[]>("/agents/runs", { token });
  },
  deleteAgentRun(runId: string, token: string) {
    return request<void>(`/agents/runs/${runId}`, {
      method: "DELETE",
      token
    });
  }
};

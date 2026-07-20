import { logger } from "@/lib/logger";

const BASE_URL = "https://api.printify.com/v1";
const TOKEN = process.env.PRINTIFY_API_TOKEN;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
};

export class PrintifyError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "PrintifyError";
  }
}

async function request<T>({ method, path, body }: RequestOptions, retries = 2): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logger.debug({ method, url }, "Printify API request");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "PODApp/1.0",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 429 && retries > 0) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 5;
      logger.warn({ retryAfter }, "Printify rate limited, retrying");
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return request<T>({ method, path, body }, retries - 1);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new PrintifyError(response.status, `Printify API error: ${response.status}`, errorBody);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const printifyClient = { request };

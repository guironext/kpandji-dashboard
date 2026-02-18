import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Fetch with retry for transient network/connection failures */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { maxRetries?: number; delayMs?: number }
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const delayMs = options?.delayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, init);
      // Retry on 5xx server errors (connection/DB issues)
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        errMsg.includes("fetch") ||
        errMsg.includes("network") ||
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("connection") ||
        errMsg.includes("ECONNRESET") ||
        errMsg.includes("ETIMEDOUT") ||
        errMsg.includes("timeout");
      if (isRetryable && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a number with spaces as thousand separators and no decimals
export function formatNumberWithSpaces(value: number): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0";
  }
  const rounded = Math.round(Number(value));
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XAF', 'FCFA');
}

// Alternative with "millions" text for large amounts
export function formatCFAWithMillions(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} millions FCFA`;
  }
  return formatCFA(amount);
}

// Format USD currency
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format USD with spaces (for display without $ symbol)
export function formatUSDWithSpaces(amount: number): string {
  const formatted = amount.toFixed(2);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart}.${parts[1]}`;
}

// Translate English text to French using MyMemory Translation API
export async function translateToFrench(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return '';
  }

  try {
    // Use MyMemory Translation API (free, no auth required for basic use)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`
    );
    
    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    
    return text; // Return original if translation fails
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

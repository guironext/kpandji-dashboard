import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

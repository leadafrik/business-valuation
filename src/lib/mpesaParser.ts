/**
 * Rentflow – M-Pesa Receipt Parser
 *
 * This module extracts structured payment data from:
 *  1. Pasted M-Pesa SMS text
 *  2. OCR-extracted text from a receipt screenshot
 *
 * It returns a ParsedMpesaReceipt with a confidence score and
 * a list of validation flags for admin review.
 */

import type { ParsedMpesaReceipt } from "@/types";

// ─── Regex Patterns ──────────────────────────────────────────────────────────

// M-Pesa transaction codes: uppercase alphanumeric, 10-12 characters
const TRANSACTION_ID_RE = /\b([A-Z0-9]{10,12})\b/g;

// M-Pesa confirmed amounts: "KES 5,000" | "Ksh5000" | "KSH 12,500.00"
const AMOUNT_RE = /(?:KES|KSH|Ksh)[\s]*([\d,]+(?:\.\d{2})?)/gi;

// Full name (two or more words, capitalised)
const SENDER_NAME_RE =
  /(?:from|sent by|by|from\s+account)?[\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i;

// Kenyan phone numbers: 07xx xxx xxx or +2547xx
const PHONE_RE = /(?:\+254|0)(7\d{8}|1\d{8})/g;

// Date patterns: "12/03/2026" | "12 Mar 2026" | "2026-03-12"
const DATE_RE =
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/gi;

// Paybill / till number
const PAYBILL_RE = /(?:paybill|pay bill|till)[:\s#]*([\d]{4,8})/i;

// Account reference
const ACCOUNT_RE = /(?:account|acc|ref|reference)[:\s#]*([\w\-\/]+)/i;

// ─── Known M-Pesa message starters ──────────────────────────────────────────
const MPESA_TRIGGERS = [
  /confirmed/i,
  /m-pesa/i,
  /mpesa/i,
  /transaction/i,
  /paid to/i,
  /you have sent/i,
  /you have received/i,
];

// ─── Core Parser ────────────────────────────────────────────────────────────

export function parseMpesaText(rawText: string): ParsedMpesaReceipt {
  const text = rawText.trim();
  const flags: string[] = [];
  let confidence = 0;

  // --- Detect if this looks like an M-Pesa message at all ---
  const isMpesa = MPESA_TRIGGERS.some((r) => r.test(text));
  if (!isMpesa) {
    flags.push("TEXT_DOES_NOT_LOOK_LIKE_MPESA");
  }

  // --- Transaction ID ---
  const txMatches = [...text.matchAll(TRANSACTION_ID_RE)];
  const transactionId = txMatches.length > 0 ? txMatches[0][1] : undefined;
  if (transactionId) confidence += 0.3;
  else flags.push("NO_TRANSACTION_ID_FOUND");

  // --- Amount ---
  const amountMatches = [...text.matchAll(AMOUNT_RE)];
  let amount: number | undefined;
  if (amountMatches.length > 0) {
    amount = parseFloat(amountMatches[0][1].replace(/,/g, ""));
    confidence += 0.25;
  } else {
    flags.push("NO_AMOUNT_FOUND");
  }

  // --- Sender Name ---
  const nameMatch = SENDER_NAME_RE.exec(text);
  const senderName = nameMatch ? nameMatch[1].trim() : undefined;
  if (senderName) confidence += 0.2;
  else flags.push("NO_SENDER_NAME_FOUND");

  // --- Phone ---
  const phoneMatches = [...text.matchAll(PHONE_RE)];
  const phone =
    phoneMatches.length > 0
      ? (phoneMatches[0][0].startsWith("+")
          ? phoneMatches[0][0]
          : "+254" + phoneMatches[0][1])
      : undefined;
  if (phone) confidence += 0.1;

  // --- Date ---
  const dateMatches = [...text.matchAll(DATE_RE)];
  const date = dateMatches.length > 0 ? dateMatches[0][0] : undefined;
  if (date) confidence += 0.1;
  else flags.push("NO_DATE_FOUND");

  // --- Paybill / Till ---
  const paybillMatch = PAYBILL_RE.exec(text);
  const paybill = paybillMatch ? paybillMatch[1] : undefined;

  // --- Account Reference ---
  const accountMatch = ACCOUNT_RE.exec(text);
  const accountRef = accountMatch ? accountMatch[1] : undefined;

  // --- Bonus: if all key fields found ---
  if (transactionId && amount && senderName && date) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  return {
    transactionId,
    amount,
    date,
    senderName,
    phone,
    paybill,
    accountRef,
    rawText: text,
    confidence: Math.min(confidence, 1.0),
    flags,
  };
}

// ─── Validation against expected payment ─────────────────────────────────────

export interface MatchResult {
  isMatch: boolean;
  confidence: number; // combined
  flags: string[];
  autoApprove: boolean;
}

export function matchReceiptToPayment(
  parsed: ParsedMpesaReceipt,
  expected: {
    tenantName: string;
    amountDue: number;
    month: number;
    year: number;
    existingTransactionIds?: string[];
  }
): MatchResult {
  const flags = [...parsed.flags];
  let score = parsed.confidence;

  // Duplicate transaction check (fraud prevention)
  if (
    parsed.transactionId &&
    expected.existingTransactionIds?.includes(parsed.transactionId)
  ) {
    flags.push("DUPLICATE_TRANSACTION_ID");
    score -= 0.5;
  }

  // Amount match check (within 5% tolerance for partial)
  if (parsed.amount !== undefined) {
    const diff = Math.abs(parsed.amount - expected.amountDue);
    const pct = diff / expected.amountDue;
    if (pct < 0.01) {
      score = Math.min(score + 0.1, 1.0);
    } else if (pct <= 0.05) {
      flags.push("AMOUNT_SLIGHT_MISMATCH");
    } else {
      flags.push(
        `AMOUNT_MISMATCH: expected ${expected.amountDue}, got ${parsed.amount}`
      );
      score -= 0.15;
    }
  }

  // Name fuzzy match
  if (parsed.senderName && expected.tenantName) {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const parsedName = normalize(parsed.senderName);
    const expName = normalize(expected.tenantName);

    if (parsedName === expName) {
      score = Math.min(score + 0.1, 1.0);
    } else if (
      parsedName.includes(expName.split(" ")[0]) ||
      expName.includes(parsedName.split(" ")[0])
    ) {
      // First name match is ok
    } else {
      flags.push("NAME_MISMATCH");
      score -= 0.1;
    }
  }

  const finalScore = Math.max(0, Math.min(score, 1.0));

  return {
    isMatch: finalScore >= 0.6,
    confidence: finalScore,
    flags,
    autoApprove: finalScore >= 0.80 && !flags.includes("DUPLICATE_TRANSACTION_ID"),
  };
}

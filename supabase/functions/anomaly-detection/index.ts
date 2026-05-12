// supabase/functions/anomaly-detection/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface Transaction {
  amount: number;
  description: string;
  category: string;
  time_of_day: number;
  day_of_week: number;
}

// Simple anomaly detection logic (can be replaced with exported model)
function detectAnomaly(transaction: Transaction): { isAnomaly: boolean; score: number; reason: string } {
  let score = 0;
  let reasons: string[] = [];

  // Rule 1: Amount too high (over 3x average)
  if (transaction.amount > 1000) {
    score += 0.4;
    reasons.push("Amount unusually high");
  }

  // Rule 2: Unusual time (late night)
  if (transaction.time_of_day < 6 || transaction.time_of_day > 22) {
    score += 0.2;
    reasons.push("Unusual transaction time");
  }

  // Rule 3: Weekend transaction for business categories
  if (transaction.day_of_week >= 5 && transaction.category === "Business") {
    score += 0.15;
    reasons.push("Weekend business transaction");
  }

  const isAnomaly = score > 0.5;
  return {
    isAnomaly,
    score: Math.min(score, 1.0),
    reason: reasons.join(", ") || "Normal transaction"
  };
}

serve(async (req) => {
  const transaction: Transaction = await req.json();
  const result = detectAnomaly(transaction);
  
  return new Response(
    JSON.stringify(result),
    { headers: { "Content-Type": "application/json" } }
  );
});

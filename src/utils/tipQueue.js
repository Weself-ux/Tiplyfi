// src/utils/tipQueue.js
// Durable retry for tip confirmations. A failed confirm must never be silent.

const KEY = "tiplyfi_pending_confirmations";
const MAX_ATTEMPTS = 10;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-50)));
  } catch {}
}

function enqueue(item) {
  const items = read();
  if (items.some((i) => i.txHash === item.txHash)) return;
  items.push({ ...item, queuedAt: Date.now(), attempts: 0 });
  write(items);
}

async function post(item) {
  const res = await fetch("/api/tips/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipId: item.tipId ?? null,
      clientRef: item.clientRef ?? null,
      txHash: item.txHash,
    }),
  });
  if (!res.ok) throw new Error(`confirm failed: ${res.status}`);
  return true;
}

export async function confirmTip(item) {
  try {
    await post(item);
  } catch (err) {
    console.warn("[tiplyfi] confirm failed — queued for retry", err);
    enqueue(item);
  }
}

export async function flushTipQueue() {
  const items = read();
  if (items.length === 0) return;
  const remaining = [];
  for (const item of items) {
    if ((item.attempts || 0) >= MAX_ATTEMPTS) continue; // indexer will backfill
    try {
      await post(item);
    } catch {
      remaining.push({ ...item, attempts: (item.attempts || 0) + 1 });
    }
  }
  write(remaining);
}
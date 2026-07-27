import sql from "@/app/api/utils/sql";
import { ARC_CONFIG } from "@/app/api/utils/arc";

const TOPIC_TIPPED =
  "0xf0df44e4f3382f18e57bc7670c88542c838c23d709cadf43a2d64665f647a79f";
const TOPIC_ESCROWED =
  "0x9317e379c6a9ddc76122dbf8b1a3f54b18f2873a894ebe28a3522a54ad2df766";

const CHUNK = 10000;
const MAX_CHUNKS = 8;

async function rpc(method, params) {
  const res = await fetch(ARC_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const d = await res.json();
  if (d.error) throw new Error(`RPC ${method}: ${d.error.message}`);
  return d.result;
}

const addrFromTopic = (t) => ("0x" + t.slice(-40)).toLowerCase();

function word(data, i) {
  const d = data.startsWith("0x") ? data.slice(2) : data;
  return d.slice(i * 64, (i + 1) * 64);
}

const weiToNumber = (hex) => Number(BigInt("0x" + hex)) / 1e18;

export async function loader({ request }) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const router = (process.env.TIP_ROUTER_ADDRESS || "").toLowerCase();
  if (!router) {
    return Response.json({ error: "TIP_ROUTER_ADDRESS not set" }, { status: 400 });
  }

  const errors = [];

  try {
    const state = await sql(
      "SELECT last_block FROM indexer_state WHERE key = 'tips'",
    );
    let from = state.length > 0 ? Number(state[0].last_block) : 0;

    const head = Number(await rpc("eth_blockNumber", []));
    // Arc has deterministic instant finality: one confirmation is final,
    // so there is no reorg buffer and no rollback logic.
    if (from === 0) from = Math.max(0, head - CHUNK);

    let processed = 0;
    let chunks = 0;
    let cursor = from;
    let rpcLimited = false;

    while (cursor < head && chunks < MAX_CHUNKS) {
      const to = Math.min(cursor + CHUNK, head);

      let logs;
      try {
        logs = await rpc("eth_getLogs", [
          {
            address: router,
            fromBlock: "0x" + cursor.toString(16),
            toBlock: "0x" + to.toString(16),
          },
        ]);
      } catch (rpcErr) {
        // Public RPC rate limit. Stop cleanly and keep the progress made so
        // far — the next run resumes from here instead of starting over.
        rpcLimited = true;
        errors.push(`chunk ${cursor}-${to}: ${rpcErr.message}`);
        break;
      }

      // Be polite to the public endpoint.
      await new Promise((r) => setTimeout(r, 250));

      for (const log of logs) {
        try {
          const topic = log.topics?.[0];

          if (topic === TOPIC_TIPPED) {
            const creator = addrFromTopic(log.topics[1]);
            const tipper = addrFromTopic(log.topics[2]);
            const gross = weiToNumber(word(log.data, 0));
            const net = weiToNumber(word(log.data, 1));
            const fee = weiToNumber(word(log.data, 2));

            // Already recorded by the confirm endpoint? Nothing to do.
            const existing = await sql(
              "SELECT id FROM tips WHERE tx_hash = $1",
              [log.transactionHash],
            );
            if (existing.length > 0) continue;

            // Match a pending row first so the fan's message is preserved.
            const matched = await sql(
              `UPDATE tips
                  SET tx_hash = $1::text, status = 'confirmed'
                WHERE tx_hash IS NULL
                  AND status = 'pending'
                  AND lower(creator_address) = $2::text
                  AND abs(coalesce(gross_usdc, amount_usdc) - $3::numeric) < 0.000001
                RETURNING id`,
              [log.transactionHash, creator, gross],
            );

            if (matched.length === 0) {
              // Unmatched: the chain is the source of truth, so record it.
              const owner = await sql(
                "SELECT username FROM users WHERE lower(wallet_address) = $1",
                [creator],
              );
              if (owner.length > 0) {
                await sql(
                  `INSERT INTO tips (creator_username, creator_address, tipper_address,
                     amount, amount_usdc, gross_usdc, fee_usdc, tx_hash, status)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed')
                   ON CONFLICT (tx_hash) DO NOTHING`,
                  [
                    owner[0].username.toLowerCase(),
                    creator,
                    tipper,
                    String(net),
                    net,
                    gross,
                    fee,
                    log.transactionHash,
                  ],
                );
              }
            }
            processed++;
          }

          if (topic === TOPIC_ESCROWED) {
            await sql(
              "UPDATE tips SET payout_status = 'escrowed' WHERE tx_hash = $1",
              [log.transactionHash],
            );
            processed++;
          }
        } catch (logErr) {
          // One bad log must not stall the whole run.
          errors.push(`${log.transactionHash}: ${logErr.message}`);
        }
      }

      cursor = to;
      chunks++;
    }

    await sql(
      `INSERT INTO indexer_state (key, last_block, updated_at)
       VALUES ('tips', $1, now())
       ON CONFLICT (key) DO UPDATE SET last_block = $1, updated_at = now()`,
      [cursor],
    );

    return Response.json({
      ok: true,
      from,
      to: cursor,
      head,
      behind: head - cursor,
      processed,
      rpcLimited,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    console.error("[cron/index-tips]", err);
    // Secret-gated endpoint, so returning the message is safe and saves a round trip.
    return Response.json(
      { error: "Indexer failed", detail: err.message },
      { status: 500 },
    );
  }
}

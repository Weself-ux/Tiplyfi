import sql from "@/app/api/utils/sql";
import { rateLimit, getClientIP } from "@/app/api/utils/auth-helpers";
import { verifyArcTransaction } from "@/app/api/utils/arc";

export async function action({ request }) {
  try {
    const ip = getClientIP(request);
    const limit = rateLimit(ip, "confirm-tip", 60, 60 * 60 * 1000);
    if (!limit.allowed) {
      return Response.json(
        { error: `Too many requests. Try again in ${limit.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { tipId, clientRef, txHash } = body;

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash || "")) {
      return Response.json({ error: "Invalid transaction hash." }, { status: 400 });
    }
    if (!tipId && !clientRef) {
      return Response.json({ error: "Missing tip identifier." }, { status: 400 });
    }

    const cols =
      "id, creator_address, amount, amount_usdc, status, tx_hash";
    const rows = tipId
      ? await sql(`SELECT ${cols} FROM tips WHERE id = $1`, [tipId])
      : await sql(`SELECT ${cols} FROM tips WHERE client_ref = $1`, [clientRef]);

    if (rows.length === 0) {
      return Response.json({ error: "Tip not found." }, { status: 404 });
    }
    const tip = rows[0];

    // Retries must be safe: already confirmed with this hash is a success.
    if (tip.status === "confirmed" && tip.tx_hash === txHash) {
      return Response.json({ success: true, tipId: tip.id });
    }

    // One transaction can never back two tips.
    const dup = await sql("SELECT id FROM tips WHERE tx_hash = $1 AND id <> $2", [
      txHash,
      tip.id,
    ]);
    if (dup.length > 0) {
      return Response.json(
        { error: "This transaction is already recorded." },
        { status: 409 },
      );
    }

    const verification = await verifyArcTransaction(
      txHash,
      tip.creator_address,
      tip.amount_usdc || tip.amount,
    );
    if (!verification.valid) {
      return Response.json(
        { error: verification.reason || "Could not verify this transaction." },
        { status: 400 },
      );
    }

    await sql(
      `UPDATE tips
         SET tx_hash = $1,
             status = 'confirmed',
             tipper_address = COALESCE(tipper_address, $2)
       WHERE id = $3`,
      [txHash, verification.from || null, tip.id],
    );

    return Response.json({ success: true, tipId: tip.id });
  } catch (err) {
    console.error("Confirm tip error:", err);
    return Response.json({ error: "Could not confirm tip." }, { status: 500 });
  }
}
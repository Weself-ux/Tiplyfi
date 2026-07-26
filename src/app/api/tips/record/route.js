import sql from "@/app/api/utils/sql";
import { rateLimit, getClientIP } from "@/app/api/utils/auth-helpers";
import { verifyArcTransaction } from "@/app/api/utils/arc";

export async function action({ request }) {
  try {
    const ip = getClientIP(request);
    const limit = rateLimit(ip, "record-tip", 30, 60 * 60 * 1000); // 30 per hour
    if (!limit.allowed) {
      return Response.json(
        {
          error: `Too many requests. Try again in ${limit.retryAfter} seconds.`,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      creatorUsername,
      creatorAddress,
      tipperAddress,
      amount,
      amountUsdc,
      message,
      txHash,
    } = body;

    // Validate required fields
    if (
      !creatorUsername ||
      !creatorAddress ||
      !tipperAddress ||
      !amount ||
      !txHash
    ) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // Validate addresses
    if (
      !/^0x[a-fA-F0-9]{40}$/.test(creatorAddress) ||
      !/^0x[a-fA-F0-9]{40}$/.test(tipperAddress)
    ) {
      return Response.json(
        { error: "Invalid wallet address." },
        { status: 400 },
      );
    }

    // Validate tx hash
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return Response.json(
        { error: "Invalid transaction hash." },
        { status: 400 },
      );
    }

    // Check for duplicate tx hash
    const existing = await sql("SELECT id FROM tips WHERE tx_hash = $1", [
      txHash,
    ]);
    if (existing.length > 0) {
      return Response.json(
        { error: "This tip has already been recorded." },
        { status: 409 },
      );
    }

    const verification = await verifyArcTransaction(
      txHash,
      creatorAddress,
      amountUsdc || amount,
    );
    if (!verification.valid) {
      return Response.json(
        { error: verification.reason || "Could not verify this transaction." },
        { status: 400 },
      );
    }

    // Record the tip
    const result = await sql(
      `INSERT INTO tips (creator_username, creator_address, tipper_address, amount, amount_usdc, message, tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        creatorUsername.toLowerCase(),
        creatorAddress,
        tipperAddress,
        amount,
        amountUsdc || null,
        message || null,
        txHash,
      ],
    );

    return Response.json({
      success: true,
      tipId: result[0].id,
      createdAt: result[0].created_at,
    });
  } 
    catch (err) {
    console.error("Record tip error:", err);
    return Response.json({ error: "Could not record tip." }, { status: 500 });
  }
}

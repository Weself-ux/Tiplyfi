import sql from "@/app/api/utils/sql";
import { rateLimit, getClientIP } from "@/app/api/utils/auth-helpers";

export async function action({ request }) {
  try {
    const ip = getClientIP(request);
    const limit = rateLimit(ip, "prepare-tip", 60, 60 * 60 * 1000); // 60 per hour
    if (!limit.allowed) {
      return Response.json(
        { error: `Too many requests. Try again in ${limit.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      clientRef,
      creatorUsername,
      creatorAddress,
      tipperAddress,
      amount,
      amountUsdc,
      message,
    } = body;

    if (!clientRef || !creatorUsername || !creatorAddress || !amount) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
      return Response.json({ error: "Invalid creator address." }, { status: 400 });
    }
    if (tipperAddress && !/^0x[a-fA-F0-9]{40}$/.test(tipperAddress)) {
      return Response.json({ error: "Invalid tipper address." }, { status: 400 });
    }

    const usdc = Number(amountUsdc ?? amount);
    if (!(usdc > 0) || usdc > 100000) {
      return Response.json({ error: "Invalid amount." }, { status: 400 });
    }

    // Written BEFORE the transaction is sent, so the message survives
    // any failure between here and confirmation.
    const result = await sql(
      `INSERT INTO tips (creator_username, creator_address, tipper_address, amount, amount_usdc, message, client_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       ON CONFLICT (client_ref) DO UPDATE SET client_ref = EXCLUDED.client_ref
       RETURNING id`,
      [
        creatorUsername.toLowerCase(),
        creatorAddress,
        tipperAddress || null,
        amount,
        usdc,
        message ? String(message).slice(0, 200) : null,
        clientRef,
      ],
    );

    return Response.json({ tipId: result[0].id });
  } catch (err) {
    console.error("Prepare tip error:", err);
    return Response.json({ error: "Could not prepare tip." }, { status: 500 });
  }
}
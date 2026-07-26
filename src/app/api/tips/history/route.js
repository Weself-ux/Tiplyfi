import sql from "@/app/api/utils/sql";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!username) {
      return Response.json({ error: "Username is required." }, { status: 400 });
    }

    const tips = await sql(
      `SELECT id, tipper_address, amount, amount_usdc, message, tx_hash, created_at
       FROM tips
       WHERE creator_username = $1 AND status = 'confirmed'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [username.toLowerCase(), limit, offset],
    );

    const countResult = await sql(
      "SELECT COUNT(*) as total_count FROM tips WHERE creator_username = $1 AND status = 'confirmed'",
      [username.toLowerCase()],
    );

    return Response.json({
      tips: tips.map((t) => ({
        id: t.id,
        tipperAddress: t.tipper_address,
        amount: t.amount,
        amountUsdc: t.amount_usdc,
        message: t.message,
        txHash: t.tx_hash,
        createdAt: t.created_at,
      })),
      totalCount: parseInt(countResult[0].total_count),
      page,
      limit,
    });
  } catch (err) {
    console.error("Tip history error:", err);
    return Response.json(
      { error: "Could not fetch tip history.", tips: [] },
      { status: 500 },
    );
  }
}

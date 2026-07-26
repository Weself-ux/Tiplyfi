import sql from "@/app/api/utils/sql";
import { validateSession } from "@/app/api/utils/auth-helpers";

export async function loader({ request }) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rows = await sql(
      `SELECT coalesce(sum(amount_usdc), 0) AS total, count(*) AS count
         FROM tips
        WHERE creator_username = $1
          AND status = 'confirmed'
          AND payout_status = 'escrowed'`,
      [user.username.toLowerCase()],
    );

    return Response.json({
      total: Number(rows[0].total),
      count: Number(rows[0].count),
    });
  } catch (err) {
    console.error("Escrow lookup error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

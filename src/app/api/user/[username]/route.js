import sql from "@/app/api/utils/sql";

export async function loader({ request, params }) {
  try {
    const { username } = params;

    if (!username) {
      return Response.json({ error: "Username is required." }, { status: 400 });
    }

    const rows = await sql(
      "SELECT username, wallet_address, full_name, created_at, fee_mode FROM users WHERE username = $1",
      [username.toLowerCase()],
    );

    if (rows.length === 0) {
      return Response.json({ error: "Creator not found." }, { status: 404 });
    }

    const user = rows[0];
    return Response.json({
      username: user.username,
      walletAddress: user.wallet_address,
      displayName: user.full_name,
      createdAt: user.created_at,
      feeMode: user.fee_mode || "creator_absorbs",
      tipRouterAddress: process.env.TIP_ROUTER_ADDRESS || "",
    });
  } catch (err) {
    console.error("User lookup error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

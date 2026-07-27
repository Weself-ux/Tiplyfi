import sql from "@/app/api/utils/sql";
import { validateSession } from "@/app/api/utils/auth-helpers";

export async function loader({ request }) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }
    const rows = await sql(
      "SELECT fee_mode FROM users WHERE username = $1",
      [user.username.toLowerCase()],
    );
    return Response.json({ feeMode: rows[0]?.fee_mode || "creator_absorbs" });
  } catch (err) {
    console.error("Fee mode read error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function action({ request }) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { feeMode } = await request.json();
    if (feeMode !== "creator_absorbs" && feeMode !== "fan_pays") {
      return Response.json({ error: "Invalid fee mode." }, { status: 400 });
    }
    await sql("UPDATE users SET fee_mode = $1 WHERE username = $2", [
      feeMode,
      user.username.toLowerCase(),
    ]);
    return Response.json({ success: true, feeMode });
  } catch (err) {
    console.error("Fee mode update error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

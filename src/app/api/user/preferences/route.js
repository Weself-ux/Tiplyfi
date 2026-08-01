import sql from "@/app/api/utils/sql";
import { validateSession } from "@/app/api/utils/auth-helpers";

const CURRENCIES = ["USD","EUR","GBP","NGN","KES","GHS","ZAR","INR","BRL","PHP","IDR","CAD"];
const LANGUAGES = ["en","fr","es","pt","sw","ar","hi","id"];

export async function loader({ request }) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }
    const rows = await sql(
      "SELECT preferred_currency, preferred_language FROM users WHERE id = $1",
      [user.id],
    );
    return Response.json({
      currency: rows[0]?.preferred_currency || "USD",
      language: rows[0]?.preferred_language || "en",
    });
  } catch (err) {
    console.error("Preferences read error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function action({ request }) {
  try {
    const user = await validateSession(request);
    if (!user) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { currency, language } = await request.json();

    if (currency !== undefined && !CURRENCIES.includes(currency)) {
      return Response.json({ error: "Unsupported currency." }, { status: 400 });
    }
    if (language !== undefined && !LANGUAGES.includes(language)) {
      return Response.json({ error: "Unsupported language." }, { status: 400 });
    }

    await sql(
      `UPDATE users
          SET preferred_currency = COALESCE($1, preferred_currency),
              preferred_language = COALESCE($2, preferred_language)
        WHERE id = $3`,
      [currency ?? null, language ?? null, user.id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("Preferences update error:", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

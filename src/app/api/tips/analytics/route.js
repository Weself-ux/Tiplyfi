import sql from "@/app/api/utils/sql";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return Response.json({ error: "Username is required." }, { status: 400 });
    }

    // Total earnings and tip count
    const totals = await sql(
      `SELECT 
        COUNT(*) as tip_count,
        COALESCE(SUM(amount_usdc), 0) as total_earnings
       FROM tips
       WHERE creator_username = $1`,
      [username.toLowerCase()],
    );

    // Top 5 tippers by total amount
    const topTippers = await sql(
      `SELECT 
        tipper_address,
        COUNT(*) as tip_count,
        SUM(amount_usdc) as total_amount
       FROM tips
       WHERE creator_username = $1 AND amount_usdc IS NOT NULL
       GROUP BY tipper_address
       ORDER BY total_amount DESC
       LIMIT 5`,
      [username.toLowerCase()],
    );

    // Earnings over time (last 30 days, grouped by day)
    const earningsOverTime = await sql(
      `SELECT 
        DATE(created_at) as tip_date,
        COUNT(*) as tip_count,
        SUM(amount_usdc) as daily_total
       FROM tips
       WHERE creator_username = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY tip_date ASC`,
      [username.toLowerCase()],
    );

    // Monthly earnings — accepts a year/month so the dashboard can show
    // each calendar month's daily breakdown, not just a rolling 30 days.
    const now = new Date();
    const yearParam = parseInt(url.searchParams.get("year")) || now.getFullYear();
    const monthParam = parseInt(url.searchParams.get("month")) || now.getMonth() + 1;

    const monthlyEarnings = await sql(
      `SELECT 
        DATE(created_at) as tip_date,
        COUNT(*) as tip_count,
        SUM(amount_usdc) as daily_total
       FROM tips
       WHERE creator_username = $1
         AND EXTRACT(YEAR FROM created_at) = $2
         AND EXTRACT(MONTH FROM created_at) = $3
       GROUP BY DATE(created_at)
       ORDER BY tip_date ASC`,
      [username.toLowerCase(), yearParam, monthParam],
    );

    const availableMonths = await sql(
      `SELECT DISTINCT
        EXTRACT(YEAR FROM created_at)::int as year,
        EXTRACT(MONTH FROM created_at)::int as month
       FROM tips
       WHERE creator_username = $1
       ORDER BY year DESC, month DESC`,
      [username.toLowerCase()],
    );

    // Recent tips (last 5)
    const recentTips = await sql(
      `SELECT tipper_address, amount_usdc, message, tx_hash, created_at
       FROM tips
       WHERE creator_username = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [username.toLowerCase()],
    );

    return Response.json({
      totalEarnings: parseFloat(totals[0].total_earnings) || 0,
      tipCount: parseInt(totals[0].tip_count) || 0,
      topTippers: topTippers.map((t) => ({
        address: t.tipper_address,
        tipCount: parseInt(t.tip_count),
        totalAmount: parseFloat(t.total_amount),
      })),
      earningsOverTime: earningsOverTime.map((e) => ({
        date: e.tip_date,
        count: parseInt(e.tip_count),
        total: parseFloat(e.daily_total),
      })),
      monthlyEarnings: monthlyEarnings.map((e) => ({
        date: e.tip_date,
        count: parseInt(e.tip_count),
        total: parseFloat(e.daily_total),
      })),
      selectedYear: yearParam,
      selectedMonth: monthParam,
      availableMonths: availableMonths.map((m) => ({
        year: m.year,
        month: m.month,
      })),
      recentTips: recentTips.map((t) => ({
        tipperAddress: t.tipper_address,
        amountUsdc: t.amount_usdc,
        message: t.message,
        txHash: t.tx_hash,
        createdAt: t.created_at,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return Response.json(
      { error: "Could not fetch analytics." },
      { status: 500 },
    );
  }
}

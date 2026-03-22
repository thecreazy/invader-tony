/**
 * GET /api/cleanup — deletes expired game sessions.
 * Called hourly by Vercel Cron. Protected by CRON_SECRET.
 */
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'SERVICE_UNAVAILABLE' });
  }

  try {
    // Delete sessions that expired more than 2 hours ago
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const delRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/game_sessions?expires_at=lt.${cutoff}`,
      {
        method: 'DELETE',
        headers: {
          'apikey':        process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!delRes.ok) {
      const err = await delRes.text();
      console.error('Cleanup delete failed:', err);
      return res.status(500).json({ error: 'CLEANUP_FAILED' });
    }

    return res.status(200).json({ ok: true, cutoff });

  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: 'CLEANUP_FAILED' });
  }
}

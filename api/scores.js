/**
 * GET /api/scores — returns top 10 scores from Supabase.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const limit  = Math.min(Math.max(parseInt(req.query?.limit)  || 10, 1), 100);
    const offset = Math.max(parseInt(req.query?.offset) || 0, 0);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scores?select=name,score,created_at&order=score.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('GET scores error:', error);
    return res.status(500).json({ error: 'Failed to fetch scores' });
  }
}

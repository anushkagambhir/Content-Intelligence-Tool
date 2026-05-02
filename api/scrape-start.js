module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const APIFY_KEY = process.env.APIFY_KEY;
  if (!APIFY_KEY) return res.status(500).json({ error: 'APIFY_KEY not configured' });

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [username],
          resultsType: 'posts',
          resultsLimit: 50,
          searchType: 'user',
          searchLimit: 1,
          addParentData: true
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: 'Apify start failed', detail: text });
    }

    const data = await response.json();
    return res.status(200).json({ runId: data.data.id, status: data.data.status });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

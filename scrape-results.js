module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { runId } = req.query;
  if (!runId) return res.status(400).json({ error: 'runId required' });

  const APIFY_KEY = process.env.APIFY_KEY;
  if (!APIFY_KEY) return res.status(500).json({ error: 'APIFY_KEY not configured' });

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}?token=${APIFY_KEY}`
    );

    if (!response.ok) return res.status(500).json({ error: 'Status check failed' });

    const data = await response.json();
    return res.status(200).json({
      status: data.data.status,
      runId,
      datasetId: data.data.defaultDatasetId
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

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
    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}/dataset/items?token=${APIFY_KEY}&limit=100`;
    const response = await fetch(url);
    const rawText = await response.text();

    if (!response.ok) {
      return res.status(500).json({ error: 'Apify dataset fetch failed', status: response.status, detail: rawText.slice(0, 500) });
    }

    let items;
    try {
      items = JSON.parse(rawText);
    } catch(e) {
      return res.status(500).json({ error: 'Failed to parse Apify response', raw: rawText.slice(0, 500) });
    }

    if (!items || !items.length) {
      return res.status(404).json({ error: 'Empty dataset', runId, itemCount: 0 });
    }

    // Find profile item
    const profileItem = items.find(i => i.followersCount !== undefined) || {};
    const anyPost = items.find(i => i.ownerUsername || (i.owner && i.owner.username)) || {};
    const ownerUsername = profileItem.username || profileItem.ownerUsername ||
      anyPost.ownerUsername || (anyPost.owner && anyPost.owner.username) || '';

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const posts = items
      .filter(i => i.shortCode || i.url)
      .filter(i => new Date(i.timestamp || i.takenAt || 0) >= sixMonthsAgo)
      .slice(0, 50)
      .map(i => ({
        id: i.id || i.shortCode,
        shortCode: i.shortCode,
        caption: (i.caption || i.text || '').slice(0, 600),
        videoPlayCount: i.videoPlayCount || i.videoViewCount || i.playsCount || 0,
        likesCount: i.likesCount || i.likes || 0,
        commentsCount: i.commentsCount || i.comments || 0,
        timestamp: i.timestamp || i.takenAt,
        videoDuration: i.videoDuration || i.duration || 0,
        hashtags: (i.hashtags || []).slice(0, 15),
        mentions: (i.mentions || []).slice(0, 5),
        isPaidPartnership: i.isPaidPartnership || false,
        type: i.type || i.productType,
        url: i.url || (i.shortCode ? `https://www.instagram.com/p/${i.shortCode}/` : '')
      }));

    return res.status(200).json({
      profile: {
        username: ownerUsername,
        fullName: profileItem.fullName || '',
        followersCount: profileItem.followersCount || 0,
        isVerified: profileItem.isVerified || false
      },
      reels: posts,
      reelsInLastSixMonths: posts.length,
      debug: {
        totalItems: items.length,
        itemTypes: [...new Set(items.map(i => i.type || i.productType || 'unknown'))],
        sampleKeys: Object.keys(items[0] || {}).slice(0, 20),
        hasFollowers: !!profileItem.followersCount
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};

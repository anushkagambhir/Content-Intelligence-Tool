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
      `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}/dataset/items?token=${APIFY_KEY}&limit=100`
    );

    if (!response.ok) return res.status(500).json({ error: 'Could not fetch dataset' });

    const items = await response.json();
    if (!items || !items.length) return res.status(404).json({ error: 'No data returned — check Instagram URL or Apify credits' });

    // Find profile item — has followersCount
    const profileItem = items.find(i => i.followersCount !== undefined) || {};

    // Find owner info from any post
    const anyPost = items.find(i => i.ownerUsername || (i.owner && i.owner.username));
    const ownerUsername = profileItem.username || profileItem.ownerUsername ||
      (anyPost && (anyPost.ownerUsername || (anyPost.owner && anyPost.owner.username))) || '';
    const followersCount = profileItem.followersCount || 0;
    const fullName = profileItem.fullName || '';
    const isVerified = profileItem.verified || profileItem.isVerified || false;

    // Filter to posts only (not profile items)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const posts = items
      .filter(i => i.shortCode || i.url) // actual posts have shortCode
      .filter(i => {
        const d = new Date(i.timestamp || i.takenAt || 0);
        return d >= sixMonthsAgo;
      })
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
        fullName,
        followersCount,
        isVerified
      },
      reels: posts,
      reelsInLastSixMonths: posts.length,
      debug: {
        totalItems: items.length,
        itemTypes: [...new Set(items.map(i => i.type || i.productType || 'unknown'))],
        hasFollowers: followersCount > 0,
        sampleKeys: Object.keys(items[0] || {}).slice(0, 20)
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

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
    if (!items.length) return res.status(404).json({ error: 'No data returned — check Instagram URL or Apify credits' });

    const profile = items[0];
    const allVideos = items.filter(i =>
      i.type === 'Video' ||
      i.productType === 'clips' ||
      (i.videoPlayCount && i.videoPlayCount > 0)
    );

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentReels = (allVideos.length ? allVideos : items)
      .filter(p => new Date(p.timestamp || p.takenAt || 0) >= sixMonthsAgo)
      .slice(0, 50)
      .map(p => ({
        id: p.id || p.shortCode,
        shortCode: p.shortCode,
        caption: (p.caption || p.text || '').slice(0, 600),
        videoPlayCount: p.videoPlayCount || p.videoViewCount || 0,
        likesCount: p.likesCount || p.likes || 0,
        commentsCount: p.commentsCount || p.comments || 0,
        timestamp: p.timestamp || p.takenAt,
        videoDuration: p.videoDuration || p.duration || 0,
        hashtags: (p.hashtags || []).slice(0, 15),
        mentions: (p.mentions || []).slice(0, 5),
        isPaidPartnership: p.isPaidPartnership || false,
        url: p.url || `https://www.instagram.com/p/${p.shortCode}/`
      }));

    return res.status(200).json({
      profile: {
        username: profile.ownerUsername || profile.username,
        fullName: profile.fullName,
        biography: profile.biography,
        followersCount: profile.followersCount || 0,
        isVerified: profile.isVerified || false
      },
      reels: recentReels,
      reelsInLastSixMonths: recentReels.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

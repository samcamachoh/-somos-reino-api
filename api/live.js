export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const CHANNEL_ID = 'UCo83C9IuFzwW1f49NAjmV-w';

  try {
    const response = await fetch(
      `https://www.youtube.com/channel/${CHANNEL_ID}/live`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    const html = await response.text();
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveBroadcast"');
    const liveUrl = `https://www.youtube.com/channel/${CHANNEL_ID}/live`;
    res.status(200).json({ live: isLive, url: liveUrl });
  } catch (err) {
    res.status(200).json({ live: false });
  }
}

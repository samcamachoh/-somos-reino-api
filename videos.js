export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const PLAYLIST_ID = 'PLsHpz1KAchvrgZdyP_RYCzfQDhkvn5Bd7';

  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`);
    const text = await response.text();

    const entries = text.split('<entry>').slice(1);
    const videos = entries.map(entry => {
      const get = tag => { const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim() : ''; };
      const videoId = get('yt:videoId');
      const title = get('title');
      const published = get('published');
      const d = new Date(published);
      const date = d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      return {
        videoId,
        title,
        date,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }).filter(v => v.videoId && v.title);

    res.status(200).json({ videos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
}

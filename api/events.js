export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://www.churchtrac.com/ical?ui=3637D3FD');
    const text = await response.text();

    // Return raw iCal so we can see what's coming back
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



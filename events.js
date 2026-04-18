export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch('https://www.churchtrac.com/ical?ui=3637D3FD');
    const text = await response.text();

    const SKIP = ['celebración', 'formación', 'celebracion', 'formacion'];
    const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    function parseDate(str) {
      const s = str.replace(/[TZ]/g, '');
      return new Date(+s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8), s.length>=12?+s.slice(8,10):0, s.length>=14?+s.slice(10,12):0);
    }

    function formatTime(d) {
      let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
    }

    const events = [];
    for (const block of text.split('BEGIN:VEVENT').slice(1)) {
      const get = k => { const m = block.match(new RegExp(k + '[^:]*:([^\r\n]+)')); return m ? m[1].trim() : ''; };
      const summary = get('SUMMARY');
      const dtstart = get('DTSTART');
      if (!summary || !dtstart) continue;
      if (SKIP.some(s => summary.toLowerCase().includes(s))) continue;
      const date = parseDate(dtstart);
      if (date < new Date()) continue;
      events.push({
        title: summary,
        date: date.toISOString(),
        day: String(date.getDate()).padStart(2, '0'),
        month: MONTHS_ES[date.getMonth()],
        weekday: DAYS_ES[date.getDay()],
        time: formatTime(date),
      });
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({ events: events.slice(0, 3) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const ICAL_URL = 'https://calendar.google.com/calendar/ical/n871b2mjner63bvfnmn06gdfdu311d03%40import.calendar.google.com/public/basic.ics';
  const SKIP = ['celebración', 'formación', 'celebracion', 'formacion', 'celebracion domingo', 'sunday'];
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  function parseDate(str) {
    const clean = str.replace(/^[^:]+:/, '').replace(/[TZ]/g, '');
    return new Date(
      +clean.slice(0,4),
      +clean.slice(4,6)-1,
      +clean.slice(6,8),
      clean.length >= 10 ? +clean.slice(8,10) : 0,
      clean.length >= 12 ? +clean.slice(10,12) : 0
    );
  }

  function formatTime(d) {
    let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
  }

  try {
    const response = await fetch(ICAL_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Not iCal');

    const today = new Date(); today.setHours(0,0,0,0);
    const events = [];

    for (const block of text.split('BEGIN:VEVENT').slice(1)) {
      const get = k => {
        const m = block.match(new RegExp(k + '[^:]*:([^\r\n]+)'));
        return m ? m[1].trim() : '';
      };
      const summary = get('SUMMARY');
      const dtstart = get('DTSTART');
      if (!summary || !dtstart) continue;
      if (SKIP.some(s => summary.toLowerCase().includes(s))) continue;
      const date = parseDate(dtstart);
      if (isNaN(date.getTime()) || date < today) continue;
      events.push({
        title: summary,
        day: String(date.getDate()).padStart(2,'0'),
        month: MONTHS_ES[date.getMonth()],
        weekday: DAYS_ES[date.getDay()],
        time: formatTime(date),
      });
    }

    events.sort((a,b) => new Date(a.day + ' ' + a.month) - new Date(b.day + ' ' + b.month));
    res.status(200).json({ events: events.slice(0,4) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

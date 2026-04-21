export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const ICAL_URL = 'https://calendar.google.com/calendar/ical/n871b2mjner63bvfnmn06gdfdu311d03%40import.calendar.google.com/public/basic.ics';
  const SKIP = ['celebración', 'formación', 'celebracion', 'formacion', 'celebracion domingo', 'sunday'];
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  function parseDate(str) {
    // Handle formats like:
    // DTSTART;TZID=America/Halifax:20260424T193000
    // DTSTART:20260424T193000
    // Extract just the datetime part after the last colon
    const clean = str.split(':').pop().trim().replace(/[TZ]/g, '');
    const y  = +clean.slice(0,4);
    const mo = +clean.slice(4,6) - 1;
    const d  = +clean.slice(6,8);
    const h  = clean.length >= 10 ? +clean.slice(8,10)  : 0;
    const mi = clean.length >= 12 ? +clean.slice(10,12) : 0;
    // Halifax is UTC-3, Eastern is UTC-4 (EDT) or UTC-5 (EST)
    // Subtract 1 hour to convert Halifax → Eastern
    return new Date(y, mo, d, h - 1, mi);
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
      const location = get('LOCATION');
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
        location: location || '2824 Michigan Ave Unit F, Kissimmee FL',
      });
    }

    events.sort((a,b) => new Date(a.date) - new Date(b.date));
    res.status(200).json({ events: events.slice(0,4) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

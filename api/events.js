export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const ICAL_URL = 'https://calendar.google.com/calendar/ical/n871b2mjner63bvfnmn06gdfdu311d03%40import.calendar.google.com/public/basic.ics';
  const SKIP = ['celebración', 'formación', 'celebracion', 'formacion', 'celebracion domingo', 'sunday'];
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  function parseDate(str) {
    // Extract datetime after last colon: handles DTSTART;TZID=America/Halifax:20260424T193000
    const clean = str.split(':').pop().trim().replace(/[TZ]/g, '');
    const y  = +clean.slice(0,4);
    const mo = +clean.slice(4,6) - 1;
    const d  = +clean.slice(6,8);
    const h  = clean.length >= 10 ? +clean.slice(8,10)  : 0;
    const mi = clean.length >= 12 ? +clean.slice(10,12) : 0;
    // Vercel server is UTC. Halifax is UTC-3.
    // 19:30 Halifax = 22:30 UTC. Server reads as 22:30 local = 9:30 PM displayed.
    // Need Eastern (UTC-4 EDT): 22:30 UTC - 4 = 18:30 = 6:30 PM... 
    // Actually: store as UTC then display in ET
    const utcDate = new Date(Date.UTC(y, mo, d, h + 3, mi)); // Halifax UTC-3 → UTC
    // Convert to Eastern Time
    const etString = utcDate.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
    // Store UTC date + ET time string for display
    return { date: utcDate, timeStr: etString };
  }

  function formatTime(d) {
    // d is now { date, timeStr } or a plain Date
    if (d.timeStr) return d.timeStr;
    let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
  }

  function getDate(d) {
    return d.date || d;
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
      const parsed = parseDate(dtstart);
      const date = getDate(parsed);
      if (isNaN(date.getTime()) || date < today) continue;
      events.push({
        title: summary,
        day: String(date.getDate()).padStart(2,'0'),
        month: MONTHS_ES[date.getMonth()],
        weekday: DAYS_ES[date.getDay()],
        time: formatTime(parsed),
        location: location || '2824 Michigan Ave Unit F, Kissimmee FL',
      });
    }

    events.sort((a,b) => new Date(a.date) - new Date(b.date));
    res.status(200).json({ events: events.slice(0,4) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

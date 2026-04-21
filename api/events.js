export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const ICAL_URL = 'https://calendar.google.com/calendar/ical/n871b2mjner63bvfnmn06gdfdu311d03%40import.calendar.google.com/public/basic.ics';
  const SKIP = ['celebración', 'formación', 'celebracion', 'formacion', 'celebracion domingo', 'sunday'];
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  function parseDate(str) {
    const raw = str.split(':').pop().trim();
    const isUTC = raw.endsWith('Z');
    const digits = raw.replace(/[^0-9]/g, '');
    const y  = +digits.slice(0,4);
    const mo = +digits.slice(4,6) - 1;
    const d  = +digits.slice(6,8);
    const h  = digits.length >= 10 ? +digits.slice(8,10) : 0;
    const mi = digits.length >= 12 ? +digits.slice(10,12) : 0;

    if (isUTC) {
      // UTC time — convert to Eastern (UTC-4 EDT)
      return new Date(Date.UTC(y, mo, d, h, mi));
    } else {
      // Local time — treat as Eastern directly
      return new Date(y, mo, d, h, mi);
    }
  }

  function formatTimeET(utcDate, isUTC) {
    const etDate = isUTC
      ? new Date(utcDate.getTime() - 4 * 60 * 60 * 1000)
      : utcDate;
    let h = etDate.getUTCHours();
    const m = etDate.getUTCMinutes();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2,'0')} ${ap}`;
  }

  function getETDate(utcDate, isUTC) {
    return isUTC
      ? new Date(utcDate.getTime() - 4 * 60 * 60 * 1000)
      : utcDate;
  }

  try {
    const response = await fetch(ICAL_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Not iCal');

    const today = new Date();
    today.setHours(0,0,0,0);

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

      const isUTC = dtstart.endsWith('Z');
      const rawDate = parseDate(dtstart);
      const etDate = getETDate(rawDate, isUTC);

      if (isNaN(rawDate.getTime()) || etDate < today) continue;

      events.push({
        title: summary,
        day: String(etDate.getUTCDate()).padStart(2,'0'),
        month: MONTHS_ES[etDate.getUTCMonth()],
        weekday: DAYS_ES[etDate.getUTCDay()],
        time: formatTimeET(rawDate, isUTC),
        location: location || '2824 Michigan Ave Unit F, Kissimmee FL',
      });
    }

    events.sort((a,b) => new Date(`${a.month} ${a.day} 2026`) - new Date(`${b.month} ${b.day} 2026`));
    res.status(200).json({ events: events.slice(0,4) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

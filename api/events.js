export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch('https://www.churchtrac.com/ical?ui=3637D3FD', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/html, */*',
        'Referer': 'https://www.churchtrac.com/',
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();

    const SKIP = ['celebración', 'formación', 'celebracion', 'formacion'];
    const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    function parseDate(str) {
      const clean = str.replace(/^[^:]+:/, '').replace(/[TZ]/g, '');
      return new Date(
        +clean.slice(0,4),
        +clean.slice(4,6) - 1,
        +clean.slice(6,8),
        clean.length >= 10 ? +clean.slice(8,10) : 0,
        clean.length >= 12 ? +clean.slice(10,12) : 0
      );
    }

    function formatTime(d) {
      let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const events = [];
    for (const block of text.split('BEGIN:VEVENT').slice(1)) {
      const get = k => { const m = block.match(new RegExp(k+'[^:]*:([^\r\n]+)')); return m ? m[1].trim() : ''; };
      const summary = get('SUMMARY');
      const dtstart = get('DTSTART');
      if (!summary || !dtstart) continue;
      if (SKIP.some(s => summary.toLowerCase().includes(s))) continue;
      const date = parseDate(dtstart);
      if​​​​​​​​​​​​​​​​

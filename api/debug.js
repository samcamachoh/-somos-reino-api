export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const ICAL_URL = 'https://calendar.google.com/calendar/ical/n871b2mjner63bvfnmn06gdfdu311d03%40import.calendar.google.com/public/basic.ics';
  const response = await fetch(ICAL_URL);
  const text = await response.text();
  // Find Church Outing block
  const block = text.split('BEGIN:VEVENT').find(b => b.includes('Church Outing'));
  res.status(200).send(`<pre>${block}</pre>`);
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  res.status(200).json({
    events: [
      {
        title: 'Church Outing',
        day: '24',
        month: 'Abril',
        weekday: 'Viernes',
        time: '7:30 PM'
      },
      {
        title: 'Casa Cafe Night',
        day: '08',
        month: 'Mayo',
        weekday: 'Viernes',
        time: '7:35 PM'
      },
      {
        title: 'Aviva Youth',
        day: '15',
        month: 'Mayo',
        weekday: 'Viernes',
        time: '7:30 PM'
      }
    ]
  });
}

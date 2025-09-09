// ถ้า FE กับ API คนละโดเมน ให้แก้เป็นโดเมนของคุณ
const API_BASE = 'https://dht-sensor-f88.vercel.app';

async function fetchLatest() {
  const s = document.querySelector('#status');
  s.textContent = 'Loading latest...';
  try {
    const r = await fetch(`${API_BASE}/api/sensors/latest`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();

    const tElem  = document.querySelector('#temp');
    const hElem  = document.querySelector('#humid');
    const stElem = document.querySelector('#sensor-status');
    const upElem = document.querySelector('#updated');

    const rec = j?.latest;
    if (!rec || !rec.sensorData) {
      tElem.textContent = '--';
      hElem.textContent = '--';
      stElem.textContent = 'ออฟไลน์';
      stElem.classList.remove('ok'); stElem.classList.add('bad');
      upElem.textContent = '--';
      s.textContent = 'No data yet';
      return;
    }

    const { temperature, humidity } = rec.sensorData;

    // จัดรูปแบบ + หน่วย
    tElem.textContent = (typeof temperature === 'number')
      ? `${temperature.toFixed(1)}°C` : '--';
    hElem.textContent = (typeof humidity === 'number')
      ? `${humidity.toFixed(0)}%` : '--';

    // รองรับทั้ง timestamp และ createdAt
    const tsStr = rec.timestamp || rec.createdAt || null;
    const ts = tsStr ? new Date(tsStr) : null;
    upElem.textContent = ts ? ts.toLocaleString() : '--';

    // สดภายใน 2 นาทีถือว่าออนไลน์
    const fresh = ts ? (Date.now() - ts.getTime()) < 2 * 60 * 1000 : false;
    stElem.textContent = fresh ? 'ออนไลน์' : 'ออฟไลน์';
    stElem.classList.toggle('ok', fresh);
    stElem.classList.toggle('bad', !fresh);

    s.textContent = 'OK';
  } catch (e) {
    console.error('fetchLatest error:', e);
    s.textContent = 'Fetch error';
  }
}

document.querySelector('#refresh').addEventListener('click', fetchLatest);
fetchLatest();
setInterval(fetchLatest, 15000); // 15 วินาที

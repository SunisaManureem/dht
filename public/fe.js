
async function fetchLatest() {
  const s = document.querySelector('#status');
  s.textContent = 'Loading latest...';
  try {
    const r = await fetch('/api/sensors/latest');
    const j = await r.json();
    const rec = j.latest;
    const tElem = document.querySelector('#temp');
    const hElem = document.querySelector('#humid');
    const stElem = document.querySelector('#sensor-status');
    const upElem = document.querySelector('#updated');

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
    tElem.textContent = temperature ?? '--';
    hElem.textContent = humidity ?? '--';

    const ts = rec.createdAt ? new Date(rec.createdAt) : null;
    if (ts) upElem.textContent = ts.toLocaleString(); else upElem.textContent = '--';

    const fresh = ts ? (Date.now() - ts.getTime()) < 2*60*1000 : false;
    stElem.textContent = fresh ? 'ออนไลน์' : 'ออฟไลน์';
    stElem.classList.toggle('ok', fresh);
    stElem.classList.toggle('bad', !fresh);

    s.textContent = 'OK';
  } catch (e) {
    s.textContent = 'Fetch error';
  }
}

document.querySelector('#refresh').addEventListener('click', fetchLatest);
fetchLatest();
setInterval(fetchLatest, 15000);

const $ = (id) => document.getElementById(id);

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  $('log').textContent += line + '\n';
  console.log(line);
}

function setStatus(message) {
  $('status').textContent = `Status: ${message}`;
}

function newToken() {
  const token = `AUTO_CANARY_${crypto.randomUUID()}_${Date.now()}`;
  $('token').value = token;
  return token;
}

function targetUrl(path) {
  const base = $('target').value.replace(/\/$/, '');
  return `${base}${path}`;
}

async function autoPing() {
  const url = targetUrl('/ping');
  log(`AUTO PING ${url}`);
  const res = await fetch(url, { method: 'GET', mode: $('mode').value, cache: 'no-store' });
  log(`AUTO PING status: ${res.status} type=${res.type}`);
  if ($('mode').value !== 'no-cors') log(`AUTO PING body: ${await res.text()}`);
}

async function autoGet(token) {
  const url = targetUrl(`/receive?token=${encodeURIComponent(token)}&via=auto-get`);
  log(`AUTO GET ${url}`);
  const res = await fetch(url, { method: 'GET', mode: $('mode').value, cache: 'no-store' });
  log(`AUTO GET status: ${res.status} type=${res.type}`);
  if ($('mode').value !== 'no-cors') log(`AUTO GET body: ${await res.text()}`);
}

async function autoPost(token) {
  const url = targetUrl('/receive');
  const body = JSON.stringify({ token, via: 'auto-post-json', sentAt: new Date().toISOString() });
  log(`AUTO POST ${url} body=${body}`);
  const res = await fetch(url, {
    method: 'POST',
    mode: $('mode').value,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-Canary-Token': token },
    body,
  });
  log(`AUTO POST status: ${res.status} type=${res.type}`);
  if ($('mode').value !== 'no-cors') log(`AUTO POST body: ${await res.text()}`);
}

function autoImage(token) {
  return new Promise((resolve) => {
    const url = targetUrl(`/receive?token=${encodeURIComponent(token)}&via=auto-image&cachebust=${Date.now()}`);
    log(`AUTO IMG ${url}`);
    const img = new Image();
    img.onload = () => { log('AUTO IMG load event fired'); resolve(); };
    img.onerror = () => { log('AUTO IMG error event fired; check receiver log because request may still have arrived'); resolve(); };
    img.src = url;
    setTimeout(() => { log('AUTO IMG timeout; check receiver log'); resolve(); }, 3000);
  });
}

async function runAutoSequence() {
  const token = $('token').value || newToken();
  setStatus('automatic sequence started');
  log(`Automatic sequence started with token=${token}`);

  try {
    await autoPing();
    await autoGet(token);
    await autoPost(token);
    await autoImage(token);
    setStatus('automatic sequence finished');
    log('Automatic sequence finished');
  } catch (e) {
    setStatus(`automatic sequence stopped: ${e.name}`);
    log(`AUTO error: ${e.name}: ${e.message}`);
  }
}

$('runAgain').onclick = runAutoSequence;
$('newToken').onclick = () => log(`new token: ${newToken()}`);
$('clear').onclick = () => { $('log').textContent = ''; };

window.addEventListener('DOMContentLoaded', () => {
  newToken();
  log('Page loaded. Running automatic sequence in 800 ms.');
  setTimeout(runAutoSequence, 800);
});

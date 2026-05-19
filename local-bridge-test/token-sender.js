const $ = (id) => document.getElementById(id);

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  $('log').textContent += line + '\n';
  console.log(line);
}

function newToken() {
  const token = `CANARY_${crypto.randomUUID()}_${Date.now()}`;
  $('token').value = token;
  return token;
}

function targetUrl(path) {
  const base = $('target').value.replace(/\/$/, '');
  return `${base}${path}`;
}

async function sendGet() {
  const token = $('token').value || newToken();
  const url = targetUrl(`/receive?token=${encodeURIComponent(token)}&via=get`);
  log(`GET ${url}`);
  try {
    const res = await fetch(url, { method: 'GET', mode: $('mode').value, cache: 'no-store' });
    log(`GET status: ${res.status} type=${res.type}`);
    if ($('mode').value !== 'no-cors') log(`GET body: ${await res.text()}`);
  } catch (e) {
    log(`GET error: ${e.name}: ${e.message}`);
  }
}

async function sendPost() {
  const token = $('token').value || newToken();
  const url = targetUrl('/receive');
  const body = JSON.stringify({ token, via: 'post-json', sentAt: new Date().toISOString() });
  log(`POST ${url} body=${body}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: $('mode').value,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Canary-Token': token },
      body,
    });
    log(`POST status: ${res.status} type=${res.type}`);
    if ($('mode').value !== 'no-cors') log(`POST body: ${await res.text()}`);
  } catch (e) {
    log(`POST error: ${e.name}: ${e.message}`);
  }
}

function sendImg() {
  const token = $('token').value || newToken();
  const url = targetUrl(`/receive?token=${encodeURIComponent(token)}&via=image&cachebust=${Date.now()}`);
  log(`IMG ${url}`);
  const img = new Image();
  img.onload = () => log('IMG load event fired');
  img.onerror = () => log('IMG error event fired; check receiver log because request may still have arrived');
  img.src = url;
}

async function ping() {
  const url = targetUrl('/ping');
  log(`PING ${url}`);
  try {
    const res = await fetch(url, { method: 'GET', mode: $('mode').value, cache: 'no-store' });
    log(`PING status: ${res.status} type=${res.type}`);
    if ($('mode').value !== 'no-cors') log(`PING body: ${await res.text()}`);
  } catch (e) {
    log(`PING error: ${e.name}: ${e.message}`);
  }
}

$('newToken').onclick = () => log(`new token: ${newToken()}`);
$('sendGet').onclick = sendGet;
$('sendPost').onclick = sendPost;
$('sendImg').onclick = sendImg;
$('ping').onclick = ping;
$('clear').onclick = () => { $('log').textContent = ''; };

newToken();
log('Ready. Set target, then send a generated canary token.');

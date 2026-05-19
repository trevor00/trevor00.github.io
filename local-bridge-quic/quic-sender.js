const $ = (id) => document.getElementById(id);

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  $('log').textContent += line + '\n';
  console.log(line);
}

function newToken() {
  const token = `QUIC_CANARY_${crypto.randomUUID()}_${Date.now()}`;
  $('token').value = token;
  return token;
}

async function tryWebTransport() {
  const base = $('target').value;
  const token = $('token').value || newToken();
  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}token=${encodeURIComponent(token)}&via=webtransport`;
  log(`WebTransport attempt: ${url}`);

  if (!('WebTransport' in window)) {
    log('WebTransport is not available in this browser.');
    return;
  }

  let transport;
  try {
    transport = new WebTransport(url);
    log('WebTransport object created. Waiting for ready...');
    await transport.ready;
    log('WebTransport ready resolved.');

    const writer = transport.datagrams.writable.getWriter();
    const payload = new TextEncoder().encode(`token=${token}`);
    await writer.write(payload);
    log(`Datagram write attempted, bytes=${payload.length}`);
    writer.releaseLock();

    transport.close({ closeCode: 0, reason: 'test complete' });
    log('Transport closed.');
  } catch (e) {
    log(`WebTransport error: ${e.name}: ${e.message}`);
    if (transport) {
      try { transport.close({ closeCode: 1, reason: 'error' }); } catch (_) {}
    }
  }
}

$('newToken').onclick = () => log(`new token: ${newToken()}`);
$('connect').onclick = tryWebTransport;
$('auto').onclick = () => {
  log('Automatic WebTransport attempt scheduled in 800 ms.');
  setTimeout(tryWebTransport, 800);
};
$('clear').onclick = () => { $('log').textContent = ''; };

newToken();
log('Ready. Start pc-server/udp_logger.py first, then try WebTransport.');

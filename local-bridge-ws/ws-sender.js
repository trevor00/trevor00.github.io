const $ = (id) => document.getElementById(id);

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  $('log').textContent += line + '\n';
  console.log(line);
}

function newToken() {
  const token = `WS_CANARY_${crypto.randomUUID()}_${Date.now()}`;
  $('token').value = token;
  return token;
}

function tryWebSocket() {
  const base = $('target').value;
  const token = $('token').value || newToken();
  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}token=${encodeURIComponent(token)}&via=websocket`;

  log(`WebSocket attempt: ${url}`);

  let ws;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    log(`WebSocket constructor error: ${e.name}: ${e.message}`);
    return;
  }

  ws.onopen = () => {
    log('WebSocket open event fired');
    try {
      const payload = JSON.stringify({ token, via: 'websocket-message', sentAt: new Date().toISOString() });
      ws.send(payload);
      log(`WebSocket message sent: ${payload}`);
    } catch (e) {
      log(`WebSocket send error: ${e.name}: ${e.message}`);
    }
  };

  ws.onmessage = (event) => {
    log(`WebSocket message received: ${event.data}`);
  };

  ws.onerror = () => {
    log('WebSocket error event fired');
  };

  ws.onclose = (event) => {
    log(`WebSocket close event fired code=${event.code} reason=${event.reason}`);
  };
}

$('newToken').onclick = () => log(`new token: ${newToken()}`);
$('connect').onclick = tryWebSocket;
$('auto').onclick = () => {
  log('Automatic WebSocket attempt scheduled in 800 ms.');
  setTimeout(tryWebSocket, 800);
};
$('clear').onclick = () => { $('log').textContent = ''; };

newToken();
log('Ready. Start local ws_logger.py first, then try WebSocket.');

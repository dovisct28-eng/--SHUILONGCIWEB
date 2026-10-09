const test = require('node:test'), assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { createApp, RUNTIME_VERSION } = require('./server.js');
const { startExhibition } = require('./start-exhibition.cjs');
async function listen(t, server) {
 await new Promise(resolve => server.listen(0, resolve));
 t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
 return server.address().port;
}
test('fresh exhibition starts the real app and serves the current version and entry', async t => {
 const result = await startExhibition({ port: 0, log() {} });
 t.after(async () => { result.server.closeAllConnections(); await new Promise(resolve => result.server.close(resolve)); });
 assert.equal(result.reused, false);
 assert.equal((await (await fetch(result.url.replace('/index.html', '/api/b03-runtime'))).json()).version, RUNTIME_VERSION);
 const response = await fetch(result.url); assert.equal(response.status, 200); assert.match(await response.text(), /btn-gallery-track/);
});
test('a current exhibition is reused without creating another listener', async t => {
 const port = await listen(t, createServer(createApp()));
 const result = await startExhibition({ port, log() {} });
 assert.equal(result.reused, true); assert.equal(result.server, null); assert.equal(result.url, `http://localhost:${port}/index.html`);
});
test('older, unrelated and malformed services remain running and are not reused', async t => {
 for (const [status, body] of [[200, '{"version":"B03 V4.2"}'], [404, 'unrelated'], [200, 'invalid json']]) {
  const server = createServer((req, res) => { res.writeHead(status); res.end(body); });
  const port = await listen(t, server);
  await assert.rejects(startExhibition({ port, log() {} }), /Restart|occupied/);
  assert.equal((await fetch(`http://localhost:${port}/`)).status, status);
 }
});
test('invalid ports fail before starting a service', async () => {
 for (const port of [-1, 65536, NaN, 3002.5]) await assert.rejects(startExhibition({ port, log() {} }), /Invalid/);
});

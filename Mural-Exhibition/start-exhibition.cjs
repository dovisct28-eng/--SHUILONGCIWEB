const { createApp, RUNTIME_VERSION } = require('./server.js');

async function startExhibition({ port = Number(process.env.PORT || 3002), log = console.log } = {}) {
 if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid exhibition port');
 const origin = `http://localhost:${port}`;
 let runtime;
 try { if (port !== 0) {
  const response = await fetch(origin + '/api/b03-runtime', { signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw Error('Unrelated service');
  runtime = await response.json();
 } } catch (error) {
  if (error.cause?.code !== 'ECONNREFUSED') {
   throw Error(`Port ${port} is occupied or cannot be verified. Stop the previous exhibition server in its own window, then retry.`, { cause: error });
  }
 }
 if (runtime) {
  if (runtime.version !== RUNTIME_VERSION) throw Error(`Port ${port} serves ${runtime.version || 'an unknown version'}, expected ${RUNTIME_VERSION}. Restart that server in its own window.`);
  log(`Exhibition already running (${runtime.version}): ${origin}/index.html`);
  return { reused: true, url: origin + '/index.html', server: null };
 }
 const server = createApp().listen(port);
 try {
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
 } catch (error) {
  throw Error(`Could not start exhibition on port ${port}: ${error.code || error.message}`, { cause: error });
 }
 const url = `http://localhost:${server.address().port}/index.html`;
 log(`Exhibition (${RUNTIME_VERSION}): ${url}`);
 log('Keep this window open while using the exhibition.');
 return { reused: false, url, server };
}

if (require.main === module) startExhibition().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { startExhibition };

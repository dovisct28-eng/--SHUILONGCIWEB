const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

test('isolated Windows launcher guards preserve files and refs', { skip: process.platform !== 'win32' }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lofi guards '));
  const git = (...args) => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git('init');
  git('config', 'user.name', 'Archive test');
  git('config', 'user.email', 'archive-test@example.invalid');
  fs.mkdirSync(path.join(root, 'module-a/a01'), { recursive: true });
  fs.writeFileSync(path.join(root, 'module-a/a01/server.mjs'), '// isolated fixture\n');
  git('add', '.');
  git('commit', '-m', 'fixture');
  const baseline = git('rev-parse', 'HEAD');
  const tag = 'module-a-lofi-final-v1.0';
  git('tag', '-a', tag, '-m', 'fixture');
  fs.mkdirSync(path.join(root, 'scripts'));
  const script = fs.readFileSync(path.join(__dirname, 'Start-LofiArchive.ps1'), 'utf8')
    .replace('48f272497e86e4549c5bcd0dee275ff347171a3f', baseline)
    .replace('ShuilongciModuleALofiLauncher', `LofiFixture${process.pid}`);
  const launcher = path.join(root, 'scripts/Start-LofiArchive.ps1');
  fs.writeFileSync(launcher, script);
  const run = (expected, message) => {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', launcher,
      '-ValidateOnly', '-NoPause'], { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, expected, result.stdout + result.stderr);
    if (message) assert.match(result.stdout + result.stderr, message);
  };
  const mainBranch = git('branch', '--show-current');
  run(0); // first creation, in a path with spaces
  run(0); // reuse
  const holder = spawn('powershell.exe', ['-NoProfile', '-Command',
    `$m=New-Object Threading.Mutex($false,'Local\\LofiFixture${process.pid}'); $null=$m.WaitOne(); Write-Output READY; $null=[Console]::ReadLine(); $m.ReleaseMutex(); $m.Dispose()`], { stdio: ['pipe', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => {
      holder.stdout.once('data', resolve);
      holder.once('error', reject);
    });
    run(2, /already running/);
  } finally {
    holder.stdin.end('\n');
    await new Promise(resolve => holder.once('exit', resolve));
  }
  const worktree = path.join(root, '.lofi-preview');
  const server = path.join(worktree, 'module-a/a01/server.mjs');
  fs.appendFileSync(server, '// changed\n');
  run(1, /file changes/);
  assert.match(fs.readFileSync(server, 'utf8'), /changed/);
  fs.writeFileSync(server, '// isolated fixture\n');
  const extra = path.join(worktree, 'untracked.txt');
  fs.writeFileSync(extra, 'keep');
  run(1, /file changes/);
  assert.equal(fs.readFileSync(extra, 'utf8'), 'keep');
  fs.unlinkSync(extra); // only the test-owned file
  git('-C', worktree, 'switch', '-c', 'fixture-attached');
  run(1, /detached HEAD/);
  git('-C', worktree, 'switch', '--detach', baseline);
  fs.appendFileSync(server, '// other revision\n');
  git('-C', worktree, 'add', '.');
  git('-C', worktree, 'commit', '-m', 'other fixture');
  const otherCommit = git('-C', worktree, 'rev-parse', 'HEAD');
  run(1, /commit mismatch/);
  git('-C', worktree, 'switch', '--detach', baseline);
  git('tag', '-d', tag); // isolated test reference only
  run(1, /failed/);
  git('tag', '-a', tag, '-m', 'wrong fixture', otherCommit);
  run(1, /tag mismatch/);
  git('tag', '-d', tag);
  git('tag', '-a', tag, '-m', 'fixture', baseline);
  // A wildcard-bound unrelated listener must not be treated as a free port.
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '0.0.0.0', resolve));
  try {
    const port = listener.address().port;
    fs.writeFileSync(launcher, script.replace('$Port = 4174', `$Port = ${port}`));
    const occupied = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', launcher,
      '-NoBrowser', '-NoPause'], { encoding: 'utf8', timeout: 30000 });
    assert.equal(occupied.status, 1, occupied.stdout + occupied.stderr);
    assert.match(occupied.stdout, /occupied by an unverified process/);
    assert.equal(listener.listening, true);
  } finally {
    listener.close();
    fs.writeFileSync(launcher, script);
  }
  fs.renameSync(worktree, path.join(root, 'saved-worktree'));
  fs.mkdirSync(worktree);
  fs.writeFileSync(path.join(worktree, 'keep.txt'), 'keep');
  run(1, /not a Git worktree/);
  assert.equal(fs.readFileSync(path.join(worktree, 'keep.txt'), 'utf8'), 'keep');
  git('-C', worktree, 'init');
  run(1, /another Git repository/);
  assert.equal(git('branch', '--show-current'), mainBranch);
  assert.equal(git('rev-parse', 'HEAD'), baseline);
  console.log('Fixture retained for inspection:', root);
});

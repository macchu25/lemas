const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function requestWith(fetch) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/artqr_transport.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const context = { exports: {}, fetch, AbortController, setTimeout, clearTimeout };
  vm.runInNewContext(outputText, context);
  return context.exports.artQRRequest;
}

test('valid response is returned', async () => {
  const request = requestWith(async () => new Response('{"jobId":"abc"}'));
  assert.equal((await request('/test')).jobId, 'abc');
});

test('empty or non-JSON success never becomes a queued job', async () => {
  for (const body of ['', 'null', '<html>error</html>', '[]']) {
    const request = requestWith(async () => new Response(body));
    await assert.rejects(request('/test'), /không hợp lệ/);
  }
});

test('HTTP error is surfaced', async () => {
  const request = requestWith(async () => new Response('{"error":"Space busy"}', { status: 503 }));
  await assert.rejects(request('/test'), /Space busy/);
});

test('timeout covers body reading, not just response headers', async () => {
  const request = requestWith(async (_url, { signal }) => ({
    ok: true,
    text: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  }));
  await assert.rejects(request('/test', {}, 10), /Hết thời gian chờ/);
});

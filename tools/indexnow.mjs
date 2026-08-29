/* IndexNow submitter — pushes every sitemap URL into the crawl queues of the
   engines that accept the protocol (Bing, Yandex, Seznam, Naver; DuckDuckGo
   serves Bing's index, so it inherits the result). Google does NOT accept
   IndexNow — Google discovery is Search Console only, which is an owner task.

   Usage:  npm run submit:indexnow
   Safe to re-run: IndexNow is idempotent — resubmitting the same URLs is
   allowed and cheap. Run after any deploy that adds or meaningfully changes
   pages; there is no need to run it on every deploy.

   The key file must be LIVE on the site before submitting — the engines fetch
   https://<host>/<key>.txt to prove the submitter controls the host. This
   script verifies that first and refuses to submit until a deploy has shipped
   the key, so a premature run cannot burn the submission on a 403. */

const HOST = 'hyperquantmedia.com';
const KEY = '085de174d8fa7d9a8d0994b5ad7708f6';
const KEY_URL = `https://${HOST}/${KEY}.txt`;
const SITEMAP = `https://${HOST}/sitemap-0.xml`;

/* exitCode, not process.exit(): exiting mid-await with fetch handles open
   trips a libuv teardown assertion on Windows. */
class Abort extends Error {}
const fail = (msg) => { throw new Abort(`[indexnow] ${msg}`); };
try {

// 1. The key file must be served by the live site.
const keyRes = await fetch(KEY_URL).catch((e) => fail(`cannot reach ${KEY_URL}: ${e.message}`));
if (!keyRes.ok) {
  fail(`key file is not live yet (${keyRes.status} at ${KEY_URL}).\n` +
       `           Deploy first — public/${KEY}.txt must ship before engines will trust the submission.`);
}
const served = (await keyRes.text()).trim();
if (served !== KEY) fail(`key file content mismatch: expected ${KEY}, got "${served.slice(0, 40)}"`);

// 2. URL list comes from the LIVE sitemap, so it can never disagree with
//    what is actually deployed.
const smRes = await fetch(SITEMAP).catch((e) => fail(`cannot reach ${SITEMAP}: ${e.message}`));
if (!smRes.ok) fail(`sitemap fetch failed: ${smRes.status}`);
const urls = [...(await smRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) fail('sitemap parsed to zero URLs — refusing to submit an empty list');
console.log(`[indexnow] submitting ${urls.length} URLs from the live sitemap:`);
urls.forEach((u) => console.log(`           ${u}`));

// 3. One POST to the shared endpoint fans out to every participating engine.
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_URL, urlList: urls }),
});

// 200 = accepted; 202 = accepted, key validation pending. Anything else is a
// real problem worth reading about.
if (res.status === 200 || res.status === 202) {
  console.log(`[indexnow] accepted (${res.status}). Bing/Yandex will fetch the key file and crawl.`);
  console.log('[indexnow] note: this queues CRAWLING, not ranking — allow days, and');
  console.log('           remember Google needs Search Console instead.');
} else {
  fail(`endpoint answered ${res.status}: ${await res.text()}`);
}
} catch (e) {
  if (!(e instanceof Abort)) throw e;
  console.error(e.message);
  process.exitCode = 1;
}

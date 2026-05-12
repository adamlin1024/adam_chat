(async () => {
  if (!window.CACHE || !window.CACHE.messageDM) {
    console.log('window.CACHE.messageDM not ready, abort');
    return;
  }

  const loginUid = Number(localStorage.getItem('VOCECHAT_CURR_UID') || 0);
  if (!loginUid) {
    console.log('loginUid not found, abort');
    return;
  }

  const before = await window.CACHE.messageDM.getItem(String(loginUid));
  const beforeLen = Array.isArray(before) ? before.length : 0;
  console.log('before cleanup: bucket', loginUid, 'has', beforeLen, 'mids');

  if (beforeLen === 0) {
    console.log('bucket already empty, nothing to do');
    return;
  }

  await window.CACHE.messageDM.removeItem(String(loginUid));
  const after = await window.CACHE.messageDM.getItem(String(loginUid));
  const afterLen = Array.isArray(after) ? after.length : 0;
  console.log('after cleanup: bucket', loginUid, 'has', afterLen, 'mids');

  console.log('partner buckets (untouched):');
  const partners = {};
  await window.CACHE.messageDM.iterate(function (value, key) {
    partners[key] = Array.isArray(value) ? value.length : 0;
  });
  console.table(partners);

  console.log('---');
  console.log('cleanup done in cache. now press Ctrl+Shift+R to reload page.');
  console.log('after reload, self-DM bucket will be gone from Redux too (rehydrate reads from cache).');
})();

/**
 * حفظ محلي + API: إلا فشل السيرفر، البيانات كيبقاو فـ localStorage
 * كل تعاونية (user) عندها مفتاح بوحدو عبر username (ما كيتبدّلش مع كل login)
 */
const PREFIX = 'ta3awonia_v2_';

function userKey() {
  if (typeof window === 'undefined') return 'anon';
  try {
    const raw = localStorage.getItem('taawniya_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.username) return String(u.username).toLowerCase();
      if (u?.id) return 'uid_' + u.id;
    }
    // fallback قديم: token (للبيانات القديمة)
    const t = localStorage.getItem('taawniya_token');
    if (t) return 'tok_' + t.slice(-24);
    return 'anon';
  } catch {
    return 'anon';
  }
}

export function lsGet(collection) {
  try {
    const raw = localStorage.getItem(PREFIX + userKey() + '_' + collection);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function lsSet(collection, items) {
  try {
    localStorage.setItem(PREFIX + userKey() + '_' + collection, JSON.stringify(items || []));
  } catch (e) {
    console.warn('localStorage write failed', e);
  }
}

export function lsAdd(collection, item) {
  const list = lsGet(collection);
  const withId = { id: item.id || Date.now(), ...item };
  const next = [withId, ...list];
  lsSet(collection, next);
  return withId;
}

export function lsRemove(collection, id) {
  const next = lsGet(collection).filter((x) => String(x.id) !== String(id));
  lsSet(collection, next);
  return next;
}

/**
 * جلب: جرّب API، إلا فشل رجّع localStorage
 * إلا نجح API حدّث localStorage
 */
export async function loadCollection(api, path, collection) {
  try {
    const data = await api.get(path);
    // يدعم array مباشرة أو { items: [...] }
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    lsSet(collection, list);
    return { items: list, source: 'api', raw: data };
  } catch (e) {
    const local = lsGet(collection);
    return { items: local, source: 'local', error: e.message };
  }
}

/**
 * إضافة: خزّن محلياً دائماً، وجرّب API
 */
export async function addCollection(api, path, collection, body) {
  let serverItem = null;
  let apiError = null;
  try {
    serverItem = await api.post(path, body);
  } catch (e) {
    apiError = e.message;
  }
  const item = serverItem || { id: Date.now(), ...body, _localOnly: true };
  // أعد تحميل من local بعد الدمج
  const list = lsGet(collection);
  const withoutDup = list.filter((x) => String(x.id) !== String(item.id));
  lsSet(collection, [item, ...withoutDup]);
  return { item, apiError };
}

export async function removeCollection(api, path, collection, id) {
  let apiError = null;
  try {
    await api.del(`${path}/${id}`);
  } catch (e) {
    apiError = e.message;
  }
  lsRemove(collection, id);
  return { apiError };
}

/**
 * تعديل: حدّث محلياً دائماً، وجرّب API
 */
export async function updateCollection(api, path, collection, id, body) {
  let serverItem = null;
  let apiError = null;
  try {
    serverItem = await api.put(`${path}/${id}`, body);
  } catch (e) {
    apiError = e.message;
  }
  const list = lsGet(collection);
  const idx = list.findIndex((x) => String(x.id) === String(id));
  const merged = serverItem || (idx >= 0 ? { ...list[idx], ...body, id } : { id, ...body, _localOnly: true });
  if (idx >= 0) {
    list[idx] = merged;
  } else {
    list.unshift(merged);
  }
  lsSet(collection, list);
  return { item: merged, apiError };
}

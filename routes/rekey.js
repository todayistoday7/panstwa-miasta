// ═══════════════════════════════════════════════════════
// REKEY — when a player comes back with a new connection
// (back button, phone lock, Wi-Fi change, page reload) they get
// a new socket id. Answers, points, votes, "ready" marks etc.
// are stored under the OLD id, so without this the player would
// lose all of them. This moves everything from the old id to the
// new one, anywhere inside the room.
// Never throws.
// ═══════════════════════════════════════════════════════
'use strict';

function rekey(room, oldId, newId) {
  try {
    if (!room || !oldId || !newId || oldId === newId) return;
    const seen = new Set();
    const walk = (o) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
          if (o[i] === oldId) o[i] = newId; else walk(o[i]);
        }
        return;
      }
      if (o instanceof Set) {
        if (o.has(oldId)) { o.delete(oldId); o.add(newId); }
        return;
      }
      if (o instanceof Map) {
        if (o.has(oldId)) { const v = o.get(oldId); o.delete(oldId); o.set(newId, v); }
        o.forEach((v, k) => { if (v === oldId) o.set(k, newId); else walk(v); });
        return;
      }
      const proto = Object.getPrototypeOf(o);
      if (proto !== Object.prototype && proto !== null) return; // timers, sockets etc.
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (k === oldId) {
          const cur = o[newId];
          const plain = x => x && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
          if (!(newId in o)) o[newId] = v;
          else if (plain(cur) && plain(v)) o[newId] = Object.assign({}, v, cur); // keep both: newer wins
          delete o[k];
          if (v !== oldId) walk(v);
          continue;
        }
        if (v === oldId) o[k] = newId; else walk(v);
      }
    };
    walk(room);
  } catch (e) { /* never break a game */ }
}

module.exports = rekey;

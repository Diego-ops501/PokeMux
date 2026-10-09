const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { receive } = require('../src/domain/pokemon-state');
const state = { ws: { pokes: { list: [{ id: 'old', level: 3 }] } } };
const chunk = (gen, seq, list, total = 2) => ({ type: 'pokes-chunk', gen, seq, total, list });
assert.equal(receive(state, chunk(1, 1, [{ id: 'b', speciesId: 64, level: 20 }])), null);
assert.equal(state.ws.pokes.list[0].id, 'old', 'partial chunks keep the previous bag');
receive(state, { type: 'poke-xp', id: 'b', level: 21, xp: 123 });
receive(state, { type: 'poke-delta', poke: { id: 'b', quality: 1.7 } });
const complete = receive(state, chunk(1, 0, [{ id: 'a', speciesId: 63, level: 30 }]));
assert.deepEqual(complete.list.map(x => x.id), ['a', 'b']);
assert.equal(complete.list[1].level, 21);
assert.equal(complete.list[1].quality, 1.7);
assert.equal(receive(state, chunk(1, 0, [{ id: 'duplicate' }])), null);
assert.equal(receive(state, chunk(2, 0, [{ id: 'a' }])), null);
assert.equal(receive(state, chunk(3, 1, [{ id: 'c' }])), null);
assert.equal(receive(state, chunk(2, 1, [{ id: 'stale' }])), null);
assert.deepEqual(receive(state, chunk(3, 0, [{ id: 'a' }])).list.map(x => x.id), ['a', 'c']);
assert.equal(receive(state, chunk(4, 2, [])), null);
assert.equal(receive(state, chunk(4, 0, [], 0)), null);
receive(state, { type: 'poke-xp', id: 'old', level: 4, xp: 100 });
assert.equal(state.ws.pokes.list[0].level, 4);

// Exercise the actual injected collector, including its session baseline.
class Socket {
  constructor() { this.listeners = new Map(); }
  send() {}
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  emit(event) { this.listeners.get('message')({ data: JSON.stringify(event) }); }
}
const index = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const start = index.indexOf('wv.executeJavaScript(`(()=>{if(window.__poke)return;') + 'wv.executeJavaScript(`'.length;
const end = index.indexOf('`).catch', start);
const context = { window: { PokeMuxPokemonState: { receive }, WebSocket: Socket, fetch: () => Promise.resolve({ clone: () => ({ json: async () => ({}) }) }) }, setInterval() {}, setTimeout() {}, Date, Map, Set };
vm.runInNewContext(vm.runInNewContext('`' + index.slice(start, end) + '`', context), context);
const socket = new context.window.WebSocket();
socket.emit(chunk(1, 1, [{ id: 'b', speciesId: 64, sellValue: 10 }]));
assert.equal(context.window.__poke.ws.pokes, undefined);
socket.emit(chunk(1, 0, [{ id: 'a', speciesId: 63, sellValue: 20 }]));
assert.equal(context.window.__poke.ws.pokes.list.length, 2);
assert.equal(context.window.__poke.sess.sellG, 0, 'initial bag is not counted as new captures');
socket.emit({ type: 'poke-xp', id: 'a', level: 31, xp: 1234 });
assert.equal(context.window.__poke.ws.pokes.list[0].level, 31);
socket.emit({ type: 'poke-delta', poke: { id: 'c', speciesId: 65, sellValue: 30 } });
assert.equal(context.window.__poke.ws.pokes.list.length, 3);
assert.equal(context.window.__poke.sess.sellG, 30);
console.log('ok pokemon-state: chunks, generations, deltas, XP and actual injected collector');

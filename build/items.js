global.self = global; const C = require('../js/content.js');
console.log(JSON.stringify(C.items.map(i => ({ id: i.id, title: i.title, kind: i.kind, display_id: i.display_id || null }))));

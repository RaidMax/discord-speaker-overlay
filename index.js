const api = require('./api.js');
const web = require('./helpers/web.js');

setTimeout(api.run, 500);
setTimeout(function() {
	web.run(api);
}, 500);
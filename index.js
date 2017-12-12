const api = require('./api.js');
const web = require('./helpers/web.js');
const readline = require('readline');

// start the bot 
function run() {
  let token = api.config.getToken();
  if (token) {
    api.client.login(token);
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter your discord api token: \r\n', (tk) => {
      api.config.setToken(tk);
      rl.close();
      run();
    });
  }
}

setTimeout(function() {
	web.run(api);
	run();
}, 0);
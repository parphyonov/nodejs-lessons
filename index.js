const http = require('http');
const jokes = require('jokes');

console.log(jokes());

// Start your app with NODE_ENV=myEnvironmentName node index.js
// Put your configuration in a file (e.g. config.js) which has a switch inside of it.
// That switch should read process.env.NODE_ENV to determine the current environment and export only the config variables for that environment.

// https://github.com/airbnb/javascript

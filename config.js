/*
 * Create and import configuartion variables
 *
 */

 // 1. Start your app with NODE_ENV=myEnvironmentName node index.js
 // 2. Put your configuration in a file (e.g. config.js) which has a switch inside of it.
 // 3. That switch should read process.env.NODE_ENV to determine the current environment and export only the config variables for that environment.

 // Container for all the environments
 const environments = {};

 // Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'pirple',
  maxChecks: 5,
  twilio : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};

environments.production = {
  httpPort: 80,
  httpsPort: 443,
  envName: 'production',
  hashingSecret: 'elprip',
  maxChecks: 5,
  twilio: {
    'accountSid': '',
    'authToken': '',
    'fromPhone': ''
  }
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
// Check if this environment exists, if not default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;

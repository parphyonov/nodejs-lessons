const crypto = require('crypto');
const hashingSecret = 'azaza';

const hash = (str) => crypto.createHmac('sha256', hashingSecret).update(str).digest('hex');

for (let i = 0; i < 16; i += 1) {
  console.log(hash('azaza'));
}

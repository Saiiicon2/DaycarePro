const bcrypt = require('bcryptjs');

const passwordToHash = 'pass123'; // The password you'll use to log in
const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds).then(hash => {
  console.log('Use this hash in your DB:', hash);
});
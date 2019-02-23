let Datastore = require('nedb');
let db = {
  users: new Datastore({ filename: __dirname + '/store/users.db', autoload: true, timestampData: true}),
  chats: new Datastore({filename: __dirname + '/store/chats.db', autoload: true, timestampData: true})
};

module.exports = db;

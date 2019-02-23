const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;

let users = [];
let activeUsers = [];
let messages = [];
let db = require('./store');

app.use(express.static('assets'));


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
let generalNsp = io.of('/general');

io.on('connection', function (socket) {
  console.log('New client connected %s', socket.id);

  socket.on('register', (data) => {
    db.users.findOne({name: data.username}, (err, user) => {
      if (err) throw err;
      if (user) {
        socket.emit('user-exists', {message: 'Username already taken.', type: 'error'});
        return false;
      }

      db.users.insert(data, (err, user) => {
        if (err) throw err;
        socket.emit('registered', {user: user, message: 'Successfully registered.', type: 'error'});
        socket.broadcast.emit('new-registration', {user: user, message: 'New user joined.', type: 'joined'});
      });
    });
  });
  socket.on('login', (data) => {
    db.users.findOne(data, (err, user) => {
      if (err) {
        throw err;
      }
      if (user) {
        socket.join('general');
        socket.emit('login-success', {type: 'success', message: 'Welcome to spotlight chat.', users: activeUsers});
        user = {_id: socket.id, name: user.name, username: user.username};
        activeUsers.push(user);
        socket.broadcast.in('general').emit('new-user', user);
      } else {
        socket.emit('login-error', {type: 'error', message: 'Your login credentials are invalid.'});
      }
      return false;
    });
  });

  socket.on('image', (data) => {
    socket.broadcast.emit('new-image', data);
  });
  socket.on('disconnect', () => {
    let offlineUser = activeUsers.find(u => u._id == socket.id);
    if (offlineUser) {
      let index = activeUsers.indexOf(offlineUser);
      activeUsers.splice(index, 1);
      io.sockets.emit('offline-user', offlineUser);
    }
  })
});

server.listen(PORT, () => {
  db.users.find({}, (err, data) => {
    if (err) throw err;
    users = data;
  });
  console.log("Server started @ localhost:%s", PORT);
});

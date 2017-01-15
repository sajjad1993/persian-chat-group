var express = require('express');
     app = express();
     http = require('http');
     server = http.createServer(app);
     io = require('socket.io').listen(server);

server.listen(4000);

// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var pvs = [];
// rooms which are currently available in chat
var rooms = ['گروه ۱', 'گروه ۲', 'گروه ۳', 'گروه ۴'];
var users = [];
io.sockets.on('connection', function (socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (username) {
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = username;
        // add the client's username to the global list
        usernames[username] = username;
        rooms.push(username);
        // send client to room 1
        socket.join(username);
        // echo to client they've connected
        socket.emit('updatechat', 'سرور', 'خوش امدید', username);
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to(username).emit('updatechat', 'سرور', username + ' شما به این گروه پیوستید');
        socket.emit('updaterooms', rooms, username);
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('switchRoom', function (newroom) {
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'سرور', 'شماره به گروه  ' + newroom + 'پیوستید');
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'سرور', socket.username + ' گروه را ترک کرد');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'سرور', socket.username + ' وارد گروه شد');
        socket.emit('updaterooms', rooms, newroom);
    });


    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'سرور', socket.username + 'خارج شد');
        socket.leave(socket.room);
    });
});
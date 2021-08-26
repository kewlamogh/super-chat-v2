const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT;
let room_number = "";
let targetUsername;
let online = {};
let currentUser = "Anonymous";
let rooms = [];
const Database = require("@replit/database");
const db = new Database()


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
})

app.get("/processlogindata", (req, res) => {
  let username = req.query["username"];
  let inputPassword = req.query["password"];
  db.get(username).then(value => {
    if (value != null && value != undefined) {
      if (inputPassword == value.password) {
        currentUser = username;
        console.log(currentUser);
        res.redirect("/new");
      }
    } else {
      res.redirect("/")
    }
  });
});

app.get("/processsignupdata", (req, res) => {
  let username = req.query["username"];
  let inputPassword = req.query["password"];
  db.get(username).then(value => {
    if (value != null && value != undefined) {
      res.redirect("/signup")
    } else {  
      db.set(username, {
        password: inputPassword
      }).then(() => {});
      res.redirect("/")
    }
  });
});


app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html")
})

app.get('/new', (req, res) => {
  res.sendFile(__dirname + '/joinroom.html');
});

app.get("/err", (req, res) => {
  res.sendFile(__dirname + "/fail.html");
})

app.get('/cryptogify', (req, res) => {
  if (rooms.includes(req.query["room"])) {
    res.redirect("/err")
  } else {
    rooms.push(req.query["room"]);
  }
  console.log(rooms);
  room_number = req.query["room"];
  var crypto = require('crypto');
  var shasum = crypto.createHash('sha1');
  var crypto2 = require('crypto');
  var shasum2 = crypto.createHash('sha1'); 
  room_number = req.query["room"];
  shasum.update(room_number);
  room_number = shasum.digest("hex");
  if (online[room_number.toString()] == null && online[room_number.toString()] == undefined) { 
    online[room_number.toString()] = []; 
  }
  res.redirect("/chat")
});

app.get("/join/:chat", (req, res) => {
  room_number = req.params["chat"];
  res.redirect("/chat")
}); 

app.get("/chat", (req, res) => {
  if (currentUser == "Anonymous") {
    res.redirect("/");
  }
  res.sendFile(__dirname + '/index.html');
})

io.on('connection', (socket) => {
  let roomNum = room_number;
  room_number = "";
  let room = "room-" + roomNum.toString();
  socket.join(room);
  io.to(room).emit("joined", currentUser);
  socket.on('new message', msg => {
    io.to(room).emit('new message', msg);
    io.to(room).emit('give online peeps', online[roomNum.toString()]);
  });
  console.log(currentUser);
  currentUser = "Anonymous";
  socket.on('new perzon', username => { 
    online[roomNum].push(username);
    targetUsername = username;
    console.log(online[roomNum]);
    io.to(room).emit("room", room, roomNum, targetUsername)
  })
  socket.on('disconnect', () => {
    io.to(room).emit("leave");
  });
  socket.on('person-left', (username, room) => {
    let formatted = []
    for (var i of online[roomNum]) {
      if (i != username) {
        formatted.push(i);
      }
    }
    online[roomNum] = formatted;
  })
});

http.listen(port, () => {
  console.log(`server started` + ["!", ".", ",", "?"][Math.floor(Math.random() * 4)]);
});

console.clear();
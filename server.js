var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var validateUser = require(__dirname + '/validateuser.js');
var session = require('client-sessions');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));

var users = {};
var connections = {};
var chatrooms = [];
var chatroomName = {};
var names = ["Panda", "Squirrell", "Potato","Chicken","Nothin","Monkey"];

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "cse.unl.edu",
  user: "otiong",
  password: "B2g-Jp",
  database : "otiong"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected in MySQL!");
});

server.listen(process.env.PORT || 3000);
console.log('Server running...');


app.use(session({
  cookieName: 'session',
  secret: 'mySession',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

app.set('view engine','ejs');


app.get('/login', function(req, res){
	res.sendFile(__dirname + '/assets/view/login.html');
});

app.get('/register', function(req, res){
	res.sendFile(__dirname + '/assets/view/register.html');
});

app.post('/submit-register', function(req, res){
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var userType = req.body.userType;
	var type = 0;
	var authenticationId = req.body.authenticationId;
	var verificationNumber = '1234';
	var flag = true;

	if(userType == 'professor' && authenticationId == verificationNumber){
		type = 1;
	} else if(userType == "professor" && authenticationId != verificationNumber){
		console.log("Registration failed");
		res.sendFile(__dirname + '/assets/view/register.html');
		flag = false;
	}

	if(flag){
		con.query('INSERT INTO User (EmailAddress, Type, Username, Password) VALUES (?,?,?,?)', [email, type, username, password], function(error, result){
			if (error) throw error;
			console.log("Registration successful!");
			res.sendFile(__dirname + '/assets/view/login.html');
		});
	}
});

app.post('/submit-login', function(req, res){
  req.session.destroy();
	var username = req.body.username;
	var password = req.body.password;

  		validateUser.validUser(username,password, con, result => {

			  var isValid = result.valid;
			  console.log("VALID2 : " + isValid);
			  if(isValid === 1){
  			     console.log("YES");
             console.log(result.type);
             if(result.type === 0 ){
  		   //updateUsernames();
              upper_bound = names.length - 1;
              lower_bound = 0;
              req.session.pseudonym = "Anonymous "+names[Math.floor(Math.random()*(upper_bound - lower_bound) + lower_bound)];
              res.render(__dirname + '/assets/view/chat', {
              visibility: 'hidden'
              });
            }else{
              var roomId = makeid();
              upper_bound = names.length - 1;
              lower_bound = 0;
              req.session.pseudonym = "Professor "+ username;
              req.session.roomId = roomId;
              res.render(__dirname + '/assets/view/chat', {
              visibility: 'visible'
            });
          }

		    } else {
			       console.log("NO");
			          res.sendFile(__dirname + '/assets/view/login.html');
		    }
		});
});

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.post('/new-room', function(req, res){
	var code = req.body.chatroomCode;
  console.log(chatrooms.indexOf(code));
  if(chatrooms.indexOf(code) != -1 ){
  res.render(__dirname + '/assets/view/chatroom',{
    pseudonym : req.session.pseudonym,
    chatroomId : code,
    roomName : chatroomName[code]
  });
}

});


app.post('/create-room', function(req, res){
	var name = req.body.chatroomName;
  var code = req.body.code;
  chatrooms.push(code);
  chatroomName[code] = name;
  console.log('new room!');
  req.session.code = code;
  res.render(__dirname + '/assets/view/chatroom',{
    pseudonym : req.session.pseudonym,
    chatroomId : code,
    roomName : name
  });

});


app.get('/user-data', function(req, res){
  res.json({ name: "example" });

});


io.on('connection', function(socket){

var handshakeData = socket.request;
var code = socket.handshake.query.code;

socket.join(code);
if (connections[code]){
	connections[code].push(socket);
}else{
  connections[code] = [socket];
}

if (users[code]){
	users[code].push(socket.handshake.query.name);
}else{
  users[code] = [socket.handshake.query.name];
}

  io.to(code).emit('get users', users[code]);
	//Disconnect
	socket.on('disconnect', function(data){
		//if(!socket.username) return;
		users[code].splice(users[code].indexOf(socket.username), 1);
		io.to(code).emit('get users', users[code]);
	connections[code].splice(connections[code].indexOf(socket), 1);
	});

	//Send Message
	socket.on('send message', function(data){
		io.to(code).emit('new message', {msg: data.msg, user: data.user});
	});

	// new user
	//  socket.on('new user', function(data, callback){
  //
	// 	var isValid = 0;
	// 	socket.username = data.username;
	// 	socket.password = data.password;
	// 	validateUser.validUser(socket.username, socket.password, con, result => {
	// 		var isValid = result;
	// 		console.log("VALID2 : " + isValid);
	// 		if(isValid === 1){
	// 		console.log("YES");
	// 		callback('/chat');
	// 		console.log(data.username);
	// 		console.log(data.password);
	// 		users.push(socket.username);
	// 		updateUsernames();
	// 	} else {
	// 		console.log("NO");
	// 		callback(false);
	// 	}
	// 	});
	// })



/*
	const validUser = (username, password, callback) => {
	console.log(username + " " + password);
	var code = 0;
	con.query('SELECT Password FROM User WHERE Username = ?', [username], function(error, results, fields){


		if(error){
			callback("0");
		} else {
			console.log("IN BUT NOT IN");
			if(results.length > 0){
				console.log(results);
				console.log(results[0].Password + " " + password);
				if(results[0].Password == password){
					callback(1);
					code = 1;
				}
			} else {
				callback(2);

			}
		}
	});

}
*/
});

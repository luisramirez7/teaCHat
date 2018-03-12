//requirements
var express = require('express');
var bodyParser = require('body-parser');
//build the app
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var validateUser = require(__dirname + '/validateuser.js');

var session = require('client-sessions');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));

//way 2
var urlencodedParser = bodyParser.urlencoded({extended: true});

users = [];
connections = [];
chatrooms = [];
var names = ["Panda", "Squirrell", "Potato","Chicken","Nothin","Monkey"];

//connecting to db
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


app.get('/chat', function(req, res){
	res.sendFile(__dirname + '/view/chat.html');
});

app.get('/login', function(req, res){
	res.sendFile(__dirname + '/view/login.html');
});
//way2
app.post('/login', function(req, res){
  console.log(req.body); //print object
  res.render('chat', {data: req.body}); //gives access to entire request to chat view
})
app.get('/register', function(req, res){
	res.sendFile(__dirname + '/view/register.html');
});
/* way: 1 using router resource: http://jilles.me/express-routing-the-beginners-guide/*/
/*router.post('/chat', function(req, res){
  var username = req.body.username;
});*/

//creates user
// app.post('/submit', function(req, res){

app.post('/submit-register', function(req, res){
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var userType = req.body.userType;
	var type = 0;
	var authenticationId = req.body.authenticationId;
	var verificationNumber = '1234';
	var flag = true;

    //todo: user OBJECT  for username
    function user(username, userType, type){
      this.name = username;
      this.userType = userType;
      this.type = type;
    }
  var chatUser = user(username, userType, type);
  // console.log('work'+chatUser);


//authenticating user type
	if(userType == 'professor' && authenticationId == verificationNumber){
		type = 1;
	} else if(userType == "professor" && authenticationId != verificationNumber){
		console.log("Registration failed");
		res.sendFile(__dirname + '/assets/view/register.html');
		flag = false;
	}
//verify registration
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
             if(result.type === 0 && 1===3 ){
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
              req.session.pseudonym = "Professor "+names[Math.floor(Math.random()*(upper_bound - lower_bound) + lower_bound)];
              req.session.roomId = roomId;
              res.render(__dirname + '/assets/view/chat', {
              visibility: 'visible',
              roomId: roomId
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
	var roomName = req.body.chatroomName;
  chatrooms.push(roomName);
  console.log('new room!');
  res.render(__dirname + '/assets/view/chatroom',{
    pseudonym : req.session.pseudonym
  });

});


app.post('/create-room', function(req, res){
	var roomName = req.body.chatroomName;
  chatrooms.push(roomName);
  console.log('new room!');
  res.render(__dirname + '/assets/view/chatroom',{
    pseudonym : req.session.pseudonym
  });

});


app.get('/user-data', function(req, res){
  res.json({ name: "example" });

});


io.on('connection', function(socket){
	connections.push(socket);
	console.log('Connected : %s sockets connected', connections.length);
  var handshakeData = socket.request;

  users.push(socket.handshake.query.name);
  console.log(users);
  io.sockets.emit('get users', users);
	//Disconnect
	socket.on('disconnect', function(data){
		//if(!socket.username) return;
		users.splice(users.indexOf(socket.username), 1);
		io.sockets.emit('get users', users);
	connections.splice(connections.indexOf(socket), 1);
	console.log('Disconnected : %s sockets connected', connections.length);
	});

	//Send Message
	socket.on('send message', function(data){
		io.sockets.emit('new message', {msg: data.msg, user: data.user});
	});

	// user enters room
	 socket.on('new user', function(data, callback){

		var isValid = 0;
		socket.username = data.username;
		socket.password = data.password;
		validateUser.validUser(socket.username, socket.password, con, result => {
			var isValid = result;
			console.log("VALID2 : " + isValid);
			if(isValid === 1){
			console.log("YES");
			callback('/chat');
			console.log(data.username);
			console.log(data.password);
			users.push(socket.username);
			updateUsernames(); //move to index.js
		} else {
			console.log("NO");
			callback(false);
		}
		});
	})
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

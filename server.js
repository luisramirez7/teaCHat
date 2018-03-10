//requirements
var express = require('express');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var validateUser = require(__dirname + '/validateuser.js');
//build the app
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));

users = [];
connections = [];

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

app.get('/chat', function(req, res){
	res.sendFile(__dirname + '/view/chat.html');
});

app.get('/login', function(req, res){
	res.sendFile(__dirname + '/view/login.html');
});

app.get('/register', function(req, res){
	res.sendFile(__dirname + '/view/register.html');
});

app.post('/submit', function(req, res){
  //todo: user model for username
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var userType = req.body.userType;
	var type = 0;
	var authenticationId = req.body.authenticationId;
	var verificationNumber = '1234';
	var flag = true;
//authenticating user type 
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

io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log('Connected : %s sockets connected', connections.length);

	//Disconnect
	socket.on('disconnect', function(data){
		//if(!socket.username) return;
		users.splice(users.indexOf(socket.username), 1);
		updateUsernames();
	connections.splice(connections.indexOf(socket), 1);
	console.log('Disconnected : %s sockets connected', connections.length);
	});

	//Send Message
	socket.on('send message', function(data){
		io.sockets.emit('new message', {msg: data, user: socket.username});
	});

	// new user
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
			updateUsernames();
		} else {
			console.log("NO");
			callback(false);
		}
		});
	})

	function updateUsernames(){
		io.sockets.emit('get users', users);
	}

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

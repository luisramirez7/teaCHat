var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
users = [];
connections = [];


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
	res.sendFile(__dirname + '/index.html');
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
		//var isValid = validUser(data.username, data.password);
		
		var isValid = 0;
		socket.username = data.username;
		socket.password = data.password;
		validUser(socket.username, socket.password, result => {
			var isValid = result;
			console.log("VALID2 : " + isValid);
			if(isValid === 1){
			console.log("YES");
			callback(true);
			console.log(data.username);
			console.log(data.password);		
			users.push(socket.username);
			updateUsernames();
		} else {
			console.log("NO");
			callback(false);
		}
		}); //WHY RETURN UNDEFINEDDDD? IS IT CONCURRENT??

			//console.log("VALID1 : " + validUser(data.username, data.password));
	
	})

	function updateUsernames(){
		io.sockets.emit('get users', users);
	}

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
});
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var validateUser = require(__dirname + '/validateuser.js');
var session = require('client-sessions');
var formidable = require('formidable');
var nodemailer = require('nodemailer');

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

//render login.ejs
app.get('/login', function(req, res){
	 res.render(__dirname + '/assets/view/login', {
	 	errorCode: ''
	 });
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

	//verification number for professor-type registration
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
		con.query('INSERT INTO ChatroomUser (EmailAddress, Type, Username, Password) VALUES (?,?,?,?)', [email, type, username, password], function(error, result){
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
              	upper_bound = names.length - 1;
              	lower_bound = 0;
              	req.session.pseudonym = "Professor "+ username;
              	res.render(__dirname + '/assets/view/chat', {
             		visibility: 'visible'
            	});
          	}
	 	} else {
			console.log("NO");
			res.render(__dirname + '/assets/view/login', {
	 			errorCode: 'Username or password is incorrect! Please try again.'
	 		});
		}
	});
});

//for sending emails to user
function sendEmail(sender,recipient,title,content) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tempmail464@gmail.com',
      pass: 'jiayehvinay'
    },
    tls: {
        rejectUnauthorized: false
    }
  });

  var mailOptions = {
    from: sender,
    to: recipient,
    subject: title,
    text: content
  };

  var response = transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      var sent =  false;
    } else {
      console.log('Email sent: ' + info.response);
      var sent =  true;
    }
  return sent;
  });
  return response;
};

app.post('/new-room', function(req, res){
	var code = req.body.chatroomCode;
  	console.log(chatrooms.indexOf(code));

  	if(chatrooms.indexOf(code) != -1 ){
  		res.render(__dirname + '/assets/view/chatroom',{
    		pseudonym : req.session.pseudonym,
    		chatroomId : code,
    		roomName : chatroomName[code],
        visibility : 'hidden'
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
    	roomName : name,
      visibility : 'visible'
  	});
});


app.post('/email-chat', function(req, res){
	var email = req.body.email;
  var data = req.body.msg;
  message = "Dear Instructor, \n\nHere are the messages from today's class: \n\n";

if (typeof data != 'undefined'){

 for (var i = 0; i < data.length; i++) {
    message = message + data[i] + "\n";
    //Do something
  }

}
  message = message + "\nRegards,\nteaCHat team"
  var sent = sendEmail("support@teaCHat.com",email,"Chat Room Content",message);
  console.log(sent);
  if(sent){
    res.send('1');
  }else{
    res.send('0');
  }
});


app.get('/user-data', function(req, res){
	res.json({ name: "example" });
});

//file upload
app.post('/upload', function (req, res){
    var form = new formidable.IncomingForm();
    var path;

    form.parse(req);

    form.on('fileBegin', function (name, file){
    	if(file.name != ""){
	        file.path = __dirname + '/assets/uploads/' + file.name;
	        res.send({path: file.path, fileName: file.name});
    	} else {
    		res.send({error: 1});
    	}
    });

    form.on('file', function (name, file){
    	if(file.name != ""){
	        console.log('Uploaded ' + file.name);
    	} else {
    		console.log("Upload failed");
    	}
    });
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
		users[code].splice(users[code].indexOf(socket.handshake.query.name), 1);
		io.to(code).emit('get users', users[code]);
		connections[code].splice(connections[code].indexOf(socket), 1);
	});

	//Send Message
	socket.on('send message', function(data){
		io.to(code).emit('new message', {msg: data.msg, user: data.user});
	});

	//Send file uploads
	socket.on('send upload', function(data){
	   io.to(code).emit('new upload', {filePath: __dirname, fileName: data.fileName, user: data.user});
	});
});

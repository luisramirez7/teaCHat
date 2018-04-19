var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var validateUser = require(__dirname + '/validateUser.js');
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
var userNames = [];
var names = ["Alligator", "Anteater", "Armadillo", "Auroch", "Axolotl", "Badger", "Bat", "Beaver", "Buffalo", "Camel", "Chameleon", "Cheetah", "Chipmunk", "Chinchilla", "Chupacabra", "Cormorant", "Coyote", "Crow", "Dingo" ,
"Dinosaur",  "Dog", "Dolphin", "Dragon", "Duck", "Elephant", "Ferret", "Fox", "Frog", "Giraffe", "Gopher", "Grizzly", "Hedgehog", "Hippo", "Hyena", "Jackal", "Ibex", "Ifrit", "Iguana", "Kangaroo",
"Koala", "Kraken", "Lemur", "Leopard", "Liger", "Lion", "Llama", "Manatee", "Mink", "Monkey", "Moose", "Narwhal", "Nyan Cat", "Orangutan", "Otter", "Panda", "Penguin", "Platypus", "Python", "Pumpkin",
"Quagga", "Rabbit", "Raccoon", "Rhino", "Sheep", "Shrew", "Skunk", "Slow Loris", "Squirrel", "Tiger", "Turtle", "Walrus", "Wolf", "Wolverine", "Wombat"];
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "cse.unl.edu",
  user: "otiong",
  password: "B2g-Jp",
  database : "otiong"
});
//training
const filter = require('spam-filter')('fisher');
const newMessages = [
  ['Thank , professor.', 'good'],
  ['How do I do this?.', 'good'],
  ['I have a question', 'good'],
  ['This was very helpful', 'good'],
  ['Here is the answer', 'good'],
  ['Why did  do this?', 'good'],
  ['Help','good'],
  ['Can  say that again?','good'],
  ['How did  get that?','good'],
  ['Thanks','good'],
  ['nice','good'],
  ['Wow! That is cool!','good'],
  ['Check my work, please!', 'good'],
  ['Can check this', 'good'],
  ['wow...','bad'],
  ['Trololololol.', 'bad'],
  ['This shit is stupid', 'bad'],
  ['Wow, that is stupid', 'bad'],
  ['You\'re a bad professor', 'bad'],
  ['THIS IS LAME', 'bad'],
  ['Wtf', 'bad'],
  ['twitter', 'bad'],
  ['snapchat', 'bad'],
  ['linkedin', 'bad'],
  ['channel', 'bad'],
  ['so hai', 'bad'],
  ['gtfo','bad'],
  ['lmao','bad'],
  ['Fuck ', 'bad'],
  ['FUCK', 'bad'],
  ['Fuckwad','bad'],
  ['FUCK', 'bad'],
  ['Fuck...','bad'],
  ['Fuck em', 'bad'],
  ['What the fuck', 'bad'],
  ['Fuck', 'bad'],
  ['Oh shit', 'bad'],
  ['GADAMMIT', 'bad'],
  ['suck','bad'],
  ['dick','bad']
]
filter.empty()
newMessages.forEach(function (newMessage) {
  filter.train(newMessage[0], newMessage[1])
})
filter.setMinimum('bad', 0.65).save()
//classifying
function filterAndTrain(message){
  console.log(filter.classify(message));
  if(filter.classify(message)=='none'){

    filter.train(message, 'good').save()
  }
  return filter.isSpam(message)
}

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
	 	errorCode: '',
    successCode: ''
	 });
});

app.post('/logout', function(req, res){
  req.session.destroy();
  res.render(__dirname + '/assets/view/login', {
    errorCode: '',
    successCode: ''
  });
});

app.get('/register', function(req, res){
  res.render(__dirname + '/assets/view/register',{
    errorCode: ''
  });
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

  validateUser.validUsername(username, con, result => {
    var isValid = result.valid;
    if(isValid === 1){
      console.log("username in use");
      res.render(__dirname + '/assets/view/register', {
	 			errorCode: 'Username is already in use. Please choose another Username.'
	 		});
      }else{


      //  if(flag){
          con.query('INSERT INTO ChatroomUser (EmailAddress, Type, Username, Password) VALUES (?,?,?,?)', [email, type, username, password], function(error, result){
            if (error) throw error;
            console.log("Registration successful!");
            res.render(__dirname + '/assets/view/login', {
              errorCode: '',
              successCode: 'Registration successful!'
            });
          });
      //  }
        }

  });
});

app.post('/chatHome', function(req, res){
  if(req.session.pseudonym.includes("Anonymous")){
    res.render(__dirname + '/assets/view/chat', {
      visibility: 'hidden'
    });
  } else {
    res.render(__dirname + '/assets/view/chat', {
      visibility: 'visible'
    });
  }
});

app.post('/submit-login', function(req, res){
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

              //Unique username
              var tempUsername = "Anonymous "+names[Math.floor(Math.random()*(upper_bound - lower_bound) + lower_bound)];

              while(userNames.indexOf(tempUsername) > -1){
                  tempUsername = "Anonymous "+names[Math.floor(Math.random()*(upper_bound - lower_bound) + lower_bound)];
              }
    			    req.session.pseudonym = tempUsername;
              userNames.push(tempUsername);

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
	 			errorCode: 'Username or password is incorrect! Please try again.',
	 		  successCode: ''
      });
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
    if(filterAndTrain(data.msg)){
      (io.to(code).emit('new message', {msg: "Message has been filtered. Profanity and any insults are not allowed.", user: data.user, filteredMsg: 1}));
    }
    else{
      (io.to(code).emit('new message', {msg: data.msg, user: data.user}));
    }
	});

	//Send file uploads
	socket.on('send upload', function(data){
	   io.to(code).emit('new upload', {filePath: __dirname, fileName: data.fileName, user: data.user});
	});
});

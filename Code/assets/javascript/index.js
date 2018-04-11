$(function(){
	var socket = io.connect({
		query:{
		name:$('#pseudo').html(),
		code:$('#code').html()
		}

	});
	var $messageForm = $('#messageForm');
	var $message = $('#message');
	var $chat = $('#chat');
	var $messageArea = $('#messageArea');
	var $userFormArea = $('#userFormArea');
	var $userForm = $('#userForm');
	var $users = $('#users');
	var $username = $('#pseudo').html();
	var $password = $('#password');

	var MAX_UPLOAD_SIZE = 5.5;
	var imageReader = new FileReader();
	var videoReader = new FileReader();
	var file;

	$messageForm.submit(function(e){
		e.preventDefault();
		socket.emit('send message', {msg:$message.val(),user:$('#pseudo').html(),code:$('#code').html()});
		$message.val('');
	});

	socket.on('new message', function(data){
		$chat.append('<div class="well"><strong>'+ data.user +'</strong>: ' + data.msg +'</div>');
	});

	$userForm.submit(function(e){
		e.preventDefault();
			socket.emit('new user', {username:$username.val(), password:$password.val()}, function(data){
			console.log(data);
				if(data){
					$userFormArea.hide();
					$messageArea.show();
				}
			});

		$username.val('');
		$password.val('');
	});

	socket.on('get users', function(data){
		var html = '';
		console.log(data);
		for(i=0; i<data.length; i++){
			html += '<li class="list-group-item">' + data[i] + ' </li>'
		}
		console.log(html);
		$users.html(html);
	})

	$('#div_upload').on('change','#fileselect' , function(e){ file = e.target.files[0]; });

	$('#btnUpload').click(function(){
	    if (file){
	        if (file.type.substring(0,5) === 'image' || str.substr(str.lastIndexOf("/")+1,str.lastIndexOf("/")+3) === 'pdf'){
	            if (file.size > MAX_UPLOAD_SIZE * 1000 * 1000)
	            {
	                alert('Sorry, we can only accept files up to ' + MAX_UPLOAD_SIZE + ' MB');
	            }
	            else if (file.type.substring(0,5) === 'image' || str.substr(str.lastIndexOf("/")+1,str.lastIndexOf("/")+3) === 'pdf'){
	                // upload image
	                imageReader.readAsDataURL(file);
	            }
	        }
	        else {
	            alert("Sorry, you an only share images or pdf " + file.type);
	        }
	        // reset select box and file object
	        //$('#fileselect').val('');
	        //file = '';
	    }
	    else
	    {
	        alert("You haven't selected any file to share");
	    }
	    return false; // don't reload the page
	});

	imageReader.onload=function(e){

	    // append image to own interface
	    appendFile(e.target.result,'image','self');
	    scrollDown();

	    // share image
	    // TODO try stream?
	    socket.emit('file',e.target.result,'image');
	};

	socket.on('file', function(dataURI,type,from,data){
	    appendFile(dataURI,type,from,data);
	    scrollDown();

	});
});

// Appends either an image or a video file to user's chat window
function appendFile(URI,type,user,data){
    if (type === 'image' || type === 'pdf'){
        //$('#chat').append('<div class="well"><strong>'+ data.user +'</strong>: ' + '<img src="' + URI + '" height="150px" />' +'</div>');
        $('#chat').append('<div class="well"><strong>'+ $('#pseudo').html() +'</strong>: ' + '<img src="' + URI + '" height="150px" />' +'</div>');
    }
    else {
        $('#chat').append('<div class="well"><strong>'+ '<SYSTEM>' +'</strong>: ' + 'Unexpected error occurred..' +'</div>');
    }
}

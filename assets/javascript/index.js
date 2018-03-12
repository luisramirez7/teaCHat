$(function(){
			var socket = io.connect({ query:'name='+$('#pseudo').html() });
			var $messageForm = $('#messageForm');
			var $message = $('#message');
			var $chat = $('#chat');
			var $messageArea = $('#messageArea');
			var $userFormArea = $('#userFormArea');
			var $userForm = $('#userForm');
			var $users = $('#users');
			var $username = $('#pseudo').html();
			var $password = $('#password');

			$messageForm.submit(function(e){
				e.preventDefault();
				socket.emit('send message', {msg:$message.val(),user:$('#pseudo').html()});
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
		});

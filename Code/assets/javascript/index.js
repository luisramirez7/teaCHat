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
			var $users = $('#users');
			var $username = $('#pseudo').html();
			var $password = $('#password');
			var $uploadForm = $('#uploadFile');

			$uploadForm.submit(function(e){
				e.preventDefault();
				var formData = new FormData($(this)[0]);
  				$.ajax({
  					url : '/upload',
  					type : 'POST',
  					data : formData,
  					processData: false,
        		    contentType: false,
     		        cache : false,
   			        success : function(data) {

   			        	if(data.error == 1){
   			        		alert("Please select a file to upload. ");
   			        	} else {
        		   			socket.emit('send upload', {fileName:data.fileName,user:$('#pseudo').html(),code:$('#code').html()});
        		   		}
         			}
  				});


  			});

			$messageForm.submit(function(e){
				e.preventDefault();
				socket.emit('send message', {msg:$message.val(),user:$('#pseudo').html(),code:$('#code').html()});
				$message.val('');
			});

			socket.on('new upload', function(data){
				$chat.append('<div class="well"><strong>'+ data.user +' uploaded</strong> ' + data.fileName +' <br> <a href="'+ data.filePath +'\\assets\\uploads\\'+data.fileName+'" download>Download '+data.fileName+'</a> </div>');
			});

			socket.on('new message', function(data){
				$chat.append('<div class="well"><strong>'+ data.user +'</strong>: ' + data.msg +'</div>');
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

module.exports = {
    //Checks for username and password in the DB
    validUser: function(username, password, con, callback) {
       console.log(username + " " + password);
		var code = 0;
		con.query('SELECT * FROM ChatroomUser WHERE Username = ?', [username], function(error, results, fields){

			if(error){
				callback("0");
			} else {
				console.log("IN BUT NOT IN");
				 var user = {};
				if(results.length > 0){
					console.log(results);
					console.log(results[0].Password + " " + password);

					if(results[0].Password == password){
           				user.valid = 1;
            			user.type = results[0].Type;
						callback(user);
						code = 1;
					} else {
						user.valid = 2;
						user.type = "None";
						callback(user);
					}
				} else {
          			user.valid = 2;
          			user.type = "None";
          			callback(user);
				}
			}

		});
  },

    //Checks if the username exists in DB
    validUsername: function(username, con, callback) {
       console.log(username);
    var code = 0;
    con.query('SELECT * FROM ChatroomUser WHERE Username = ?', [username], function(error, results, fields){

      if(error){
        callback("0");
      } else {
      //  console.log("IN BUT NOT IN");
         var user = {};
         var userExist = true;
        if(results.length > 0){
          console.log(results);
          console.log(results[0].Username);
          user.valid = 1;
          userExist = true;
          callback(user);

          }
         else {
                user.valid = 2;
                userExist = false;
                callback(user);
              }

        }
      });

    }


};

module.exports = {
    validUser: function(username, password, con, callback) {
       console.log(username + " " + password);
		var code = 0;
		con.query('SELECT * FROM User WHERE Username = ?', [username], function(error, results, fields){

			if(error){
				callback("0");
			} else {
				console.log("IN BUT NOT IN");
				if(results.length > 0){
					console.log(results);
					console.log(results[0].Password + " " + password);
          var user = {};
					if(results[0].Password == password){
            user.valid = 1;
            user.type = results[0].Type;
						callback(user);
						code = 1;
					}
				} else {
          user.valid = 2;
          user.type = "None";
					callback(user);
				}
			}

		});
    }
};

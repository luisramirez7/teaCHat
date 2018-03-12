module.exports = {
    validUser: function(username, password, con, callback) {
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
};
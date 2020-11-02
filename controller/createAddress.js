const postToApi = require('../postApi');
const connection = require('../database/dbConnection');


const createAddress = {
    //creating addresess WORKING
createAddress: (req, res) => {
	// postToApi('login', {'email':'a@a.com','password':'123456'}, function(err, body){
	// 	AuthToken = body.accessToken

	// });
	try {
		var sql = "SELECT COUNT(*) AS total_addresses FROM adresses WHERE STATUS = 1";
	connection.query(sql, function (err, newResults) {
		if (err) {
			console.log(err);
		}
		else{
			console.log(newResults[0].total_addresses);
			if(newResults[0].total_addresses<60){

				postToApi.postToApi('generateAddress', [], function(err, body){
					if(err) {
						res.send({'Error':err});
						// flag(0);
					}
					else if (body.status == 2){
						res.send({'message':body.message});
						return ;
					}
					console.log(err);
					console.log(body);
				
				console.log('new TESTNET address: '+body.publicKey);
				console.log('Private Key(WIF format): '+body.privateKey);
				var sql = "INSERT INTO adresses (bitcoin, privateKey) VALUES ('"+body.publicKey+"', '"+body.privateKey.replace("0x","")+"')";
				console.log(sql);
				connection.query(sql, function (err, newResults) {
					if (err) {
						console.log(err);
					}
					else{
						console.log('new record inserted');
						res.send( {status:"success", message:'new record inserted'});
					}
				});
			});
			}
			else{
				console.log('nothing to execute addresses');
				res.send('nothing to execute addresses');
			}
		}
	});
	}
	catch(err) {
		console.log('error', err);
		throw err;
	}
	
}
};

module.exports = createAddress;
module.createAddress;
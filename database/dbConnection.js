var mysql = require("mysql");

// var connection = mysql.createConnection({
// 	host       : 'localhost',
// 	user       : 'root',
// 	password   : 'mysql',
// 	database   : 'triterras',
// 	port       :  3306
// });

var connection = mysql.createConnection({
	host       : 'localhost',
	user       : 'root',
	password   : 'test',
	database   : 'stena',
	port       :  3306
});

module.exports = connection;
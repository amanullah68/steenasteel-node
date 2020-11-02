const postToApi = require('../postApi');
const connection = require('../database/dbConnection');

const fs = require('fs');
var messageESR = "";
var path = require('path');
var assetID = '';

//Create assets for seller  WORKING
const createAssetBySupplier = {
	createAssetBySupplier: (req, res) => {

		var sql = "SELECT users.name,users.email,users.bitcoin_address,users.privateKey,supplier_certificates.id, supplier_certificates.countt,supplier_certificates.order_number,supplier_certificates.charge_number,supplier_certificates.quantity,supplier_certificates.unit,supplier_certificates.file_name,supplier_certificates.blockchain_executed,supplier_certificates.created_at FROM users INNER JOIN supplier_certificates ON (users.id = supplier_certificates.supplier_id) WHERE supplier_certificates.isActive = 1 AND supplier_certificates.blockchain_executed = 0 AND (supplier_certificates.countt=0 OR supplier_certificates.countt=1 OR supplier_certificates.countt IS NULL) AND (supplier_certificates.blockchain_confirmation IS NULL OR supplier_certificates.blockchain_confirmation=0) ORDER BY id ASC LIMIT 1";
		connection.query(sql, function (err, results) {
			if (err) {
				console.log(err);
			}
			if (results.length > 0) {
				firstResult = results[0];
				id = firstResult.id;
				count = firstResult.countt;
				address = 0;
				name = firstResult.name;

				setStatus = 2;
				updateStatus(setStatus, address, id, count, name, function (returnResult) {
					console.log('Return: ' + returnResult);
				});
				console.log('firstResult....', results);
				email = firstResult.email;
				publicKey = firstResult.bitcoin_address;
				privateKey = firstResult.privateKey;
				orderNumber = firstResult.order_number;
				chargeNumber = firstResult.charge_number;
				quantity = (firstResult.quantity).toString();
				unit = firstResult.unit;
				fileName = firstResult.file_name;

				var type = 'admin';
				getAdminData(type, function (adminReturnflag) {
					if (adminReturnflag == 0) {
						console.log('nothing found');
					}
					else {
						console.log('admin');
						console.log(adminReturnflag);
						fromAddress = adminReturnflag.bitcoin_address;
						senderPrivateKey = adminReturnflag.privateKey;

						var asset = [name, email, publicKey, privateKey, orderNumber, chargeNumber, quantity, unit, fileName, id];

						sendToBlockchain(res, asset, privateKey, async function (returnCreat) {
							console.log(returnCreat);
							if (returnCreat) {
								assetID = returnCreat;
								console.log("Asset ID: " + assetID);
								console.log('all done');
								setStatus = 1;
								address = assetID;
								console.log('ID to update: ' + id);

								await updateStatus(setStatus, address, id, count, name, function (returnResult) {
									console.log('Return: ' + returnResult);
									return res.send('done');
								});
							}
							else {
								console.log("Error on Blockchain");
								return res.send(messageESR);
							}
						});
					}
				});
			}
			else {
				console.log('No Approved Seller Order Found');
				return res.send({ status: "error", message: 'No Approved Seller Order Found' });
			}
		});
	}
}

function getAdminData(type, returnFlag) {
	var sql = "SELECT bitcoin_address, privateKey FROM users WHERE type = '" + type + "'";// AND isActive = 1";
	var adminData;
	connection.query(sql, function (err, adminResults) {
		if (err) {
			console.log(err);
			returnFlag(0);
		}
		else {
			adminData = adminResults[0];
			returnFlag(adminData);
		}
	});
}

async function sendToBlockchain(res, asset, senderPrivateKey, flag) {
	console.log('Creating Asset');

	fs.readFile(path.resolve(__dirname, '../contracts/stenasteel.sol'), async function (err, data) {
		if (err) throw err;
		console.log(data);

		console.log('asset..........', asset);
		console.log(__dirname + "publicabi");

		var sdata = String(data);

		const params = {
			a1: asset[6],
			a2: asset[0],
			a3: asset[4],
			a4: asset[5],
			a5: asset[7],
			a6: asset[8]
		};

		// console.log('params......', sdata);
		const stringifyParams = JSON.stringify(params);

		await postToApi.postToApi('ethereum/contract/deploy', {
			'params': stringifyParams,
			'contractName': 'stenasteel',
			'fileData': sdata,
			'address': asset[2],
			'privateKey': senderPrivateKey
		}, function (err, body) {
			messageESR = "";
			console.log('body................', body);
			console.log('errrr........', err);

			if (err) {
				console.log('error: ', err);
				flag(0);
			}
			else if (body.status == 2) {
				messageESR = body.message;
				flag(0);
			}
			else {
				var s = JSON.stringify(body.abi);
				console.log(s);
				assetID = body.txHash;
				if (body.errorcode) {
					messageESR = body.message;
					flag(0);
				}
				else if (body.txHash[0] === undefined) {
					console.log('body111....', body.txHash);
					messageESR = 'Nothing return';
					flag(0);
				}
				else if (body.txHash.includes("Error") === true) {
					messageESR = body.txHash;
					flag(0);
				} else {
					flag(assetID);
				}
			}
		});
	});
}

async function updateStatus(setStatus, address, id, count, name, flag) {
	try {
		if (address != 0 && address != 2) {
			console.log('hereeeeeeeeeeeeeeeeeeeee........eeeeeee', name);
			// console.log('hereeeeeeeeeeeeeeeeeeeee........COUNTTTTTTTSeeeeeee', count);
			if (count === undefined || count === null || count == 0) {
				if(name !== 'admin') {
					console.log('11111111111');
					var sql = "UPDATE supplier_certificates SET asset_id = '" + address + "', countt=1, blockchain_confirmation = 0, blockchain_executed=1 WHERE id = " + id + "";
				}
				else {
					console.log('222222222');
					var sql = "UPDATE supplier_certificates SET asset_id = '" + address + "', transfered_assetID = '" + address +"', countt=1, blockchain_confirmation = 0, blockchain_executed=1, transfered_to_Admin=1, transfered_to_countt=1, transfered_confirmations=1 WHERE id = " + id + "";
				}			}
			else if (count == 1) {
				if(name !== 'admin') {
					var sql = "UPDATE supplier_certificates SET asset_id = '" + address + "', blockchain_confirmation = 0, blockchain_executed=1, countt=2 WHERE id = " + id + "";
				}
				else {
					var sql = "UPDATE supplier_certificates SET asset_id = '" + address + "', transfered_assetID = '" + address +"', blockchain_confirmation = 0, blockchain_executed=1, transfered_to_Admin=1, transfered_confirmations=0, countt=2, transfered_to_countt=2 WHERE id = " + id + "";
				}			}
		}
		else {
			// console.log('hereeeeeeeeeeeeeeeeeeeee.11111111111111111....', id);
			if (count === undefined || count === null || count == 0) {
				if(name !=='admin') {
					var sql = "UPDATE supplier_certificates SET  countt=1, blockchain_confirmation = 0, blockchain_executed=0 WHERE id = " + id + "";
				}
				else {
					var sql = "UPDATE supplier_certificates SET  countt=1 , blockchain_confirmation = 0, blockchain_executed=0, transfered_to_countt=1 WHERE id = " + id + "";
				}			}
			else if (count == 1) {
				if(name !=='admin') {
					var sql = "UPDATE supplier_certificates SET countt=2, blockchain_executed=0 WHERE id = " + id + "";
				}
				else {
					var sql = "UPDATE supplier_certificates SET countt=2 , blockchain_executed=0, transfered_to_countt=2 WHERE id = " + id + "";
				}
			}
		}
		
		await connection.query(sql, function (err, results) {
			if (err) {
				console.log('Error: ' + err);
				flag(0);
			}
			else {
				flg = 1;
				flag(flg);
			}
		});
	}
	catch (ex) {
		console.log('Exception Arise: ' + ex);
		flag(0);
	}
}

module.exports = createAssetBySupplier;
module.createAssetBySupplier;
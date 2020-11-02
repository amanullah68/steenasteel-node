const postToApi = require('../postApi');
const connection = require('../database/dbConnection');
var messageESR = "";

// ADDED BY AMAN ULLAH 
// blockchain confirmation for deploy tx and sellerToTrader tx
const txConfirmation2 = {
	txConfirmation2: (req, res) => {
	var active = 1;
	var stop_exec = 2;
	var sql = "SELECT * FROM supplier_certificates WHERE transfered_confirmations = "+stop_exec+"";
	connection.query(sql, function (err, results) { 
		if (err) {
			console.log(err);
		}
		else{
			if(results.length>0) {
				console.log('fix error first txConfirmation');
				return res.send('Error: fix error first in Database');
			}
			else{ 
				var sql = "SELECT * FROM supplier_certificates WHERE transfered_confirmations = "+0+" AND isActive = "+active+" AND transfered_to_Admin = "+active+" AND (transfered_to_countt=0 OR transfered_to_countt=1 OR transfered_assetID IS NOT NULL) ORDER BY id ASC LIMIT 1";
				connection.query(sql, function (err, results) {
					if (err) {
						console.log(err);
					}
					else{
						console.log('result.....', results);
						if(results.length>0){
							console.log("Results");
							firstResult = results[0];
							id = firstResult.id;
							var tx = firstResult.transfered_assetID;

							if(tx !== null && tx !== undefined && tx !== '') {
							confirmation(tx, id, firstResult.transfered_confirmations, function(returnTransfer){
								console.log('transfer', tx);
								if(returnTransfer.result == 'Confirmed'){
									console.log(returnTransfer);
									console.log('all done..........', returnTransfer);
                                    value = returnTransfer;
                                    
									if(firstResult.transfered_confirmations == 0) {
										txHash = firstResult.asset_id;
		
										if(txHash != null || txHash != undefined || txHash != '' || txHash.includes('insufficient')) {
											setStatus = 1;
											console.log('ID to update1: ' + id);
											updateTXcofirmationStatus(setStatus, id, (err, value) =>{
												if(err) {
												console.log('Return: ', err);
												return res.send('Some error return while updating value');
												}
												else {
													console.log('Return: ' + value);
													console.log('done updation');
													return res.send('confirmation status updated');
												}
											});
										}
										else {
											console.log('no txHash');
											return res.send('no txHash');
										}
									}
									// for transafer assets to traders txHashSeller confirmation
									else if(firstResult.transfered_confirmations == 1) {
										console.log('...........', firstResult);
										txHash = firstResult.transfered_assetID;
		
										if(txHash != null || txHash != undefined || txHash != '') {
											console.log('ID to update2: ' + id);
											setStatus = 2;
											updateTXcofirmationStatus(setStatus, id, function (err, value){
												console.log('...........', value);
												if(err) {
													console.log('error....2', err);
													return res.send('Some error return while updating value');
												}
												else {
													console.log('Return: ' + value);
													console.log('done updation');
													return res.send('confirmation status updated');
												}
											});
										}
										else {
											console.log('no txHash');
											return res.send('no txHash');
										}
									}
									else {
										console.log('nothing to confirm');
										return res.send('nothing to confirm');
									}
								}
								else if(returnTransfer.result == 'Failed'){
									console.log('reterrrrrr1', returnTransfer);
									return res.send('Transaction failed');
								}
								else if(returnTransfer.result == 'Pending'){
									console.log('reterrrrrr2', returnTransfer);
									return res.send('Transaction still in pending');
								}
								else {
									if(tx.includes('insufficient')) {
										console.log('reterrrrrr3', returnTransfer);
										setStatus = 2;
										updateTXcofirmationStatus(setStatus, id, function (err, value){
											console.log('...........', value);
											if(err) {
												console.log('error....2', err);
												return res.send('Some error return while updating value');
											}
											else {
												console.log('Return: ' + value);
												console.log('done updation');
												return res.send('Insufficient fund in account');
											}
										});
									}
									else {
										console.log('reterrrrrr4', returnTransfer);
										return res.send('Some issue');
									}
								}
							});
						}
						else {
							console.log('nothing to execute txConfirmation');
							return res.send('nothing to execute txConfirmation');
						}
						}
						else{
							console.log('nothing to execute txConfirmation');
							return res.send('nothing to execute txConfirmation');
						}
					}
				});
			}
		}
	});
}
}

module.exports = txConfirmation2;

//function for transferring Asset to trader & buyer
const confirmation = async (txHash,id,st,flag) => {

	console.log('txHash..........',txHash);
		const params = {
			txHash: txHash
		}
	console.log("Readed"); 

	postToApi.postToApi('ethereum/contract/getTransactionReceipt',params,async function(err, body){
		messageESR = "";
		if (err) {
			console.log('error: ', err);
			flag(0);
		}
		else if (body.status == 2){
			messageESR = body.message;
			flag(0);
			return ;
		}
		else{
			console.log('body....', body);
			if(body.errorcode) {
				console.log('body1...', body);
				flag(0);
			}
			else if(body.result.includes("Confirm")){
				console.log('body2...', body);
				flag(body);
			}
			else if(body.result.includes("Failed")){
				console.log('body3...', body);

				if(st == 0) {
					var sql = "UPDATE supplier_certificates SET transfered_to_Admin = "+2+" WHERE id = "+id+"";
				}
				else {
					var sql = "UPDATE supplier_certificates SET transfered_to_Admin = "+2+" WHERE id = "+id+"";
				}
				await connection.query(sql, (err, results) => {
					if (err){
						flag(err);
					}
					else{
						flag(body);
					}
				});
			}
			else if(body.result.includes("Pending")){
				console.log('body4...', body);
				flag(body);
			}
			else{
				console.log('here.......');
			}
		}
	});
}

const updateTXcofirmationStatus = async (setStatus, id, flag) => {
	try {
		if(id){
			var sql = "UPDATE supplier_certificates SET transfered_confirmations = "+setStatus+" WHERE id = "+id+"";
		}
		await connection.query(sql, (err, results) => {
            if (err){
				flag(err);
            }
            else{
				flag(null, results);
			}
        });
    }
    catch (ex){
        console.log('Exception Arise: ' + ex);
		flag(ex);
	}
}

module.exports = txConfirmation2;
module.txConfirmation2;
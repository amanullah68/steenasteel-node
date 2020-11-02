const postToApi = require('../postApi');
const connection = require('../database/dbConnection');

const fs = require('fs');
var messageESR = "";
var path = require('path');
var assetID = '';

//Create assets for seller  WORKING
const transferToAdmin = {
    transferToAdmin: (req, res) => {

        var sql = "SELECT users.bitcoin_address, users.privateKey, supplier_certificates.id, supplier_certificates.transfered_to_countt, supplier_certificates.quantity, supplier_certificates.transfered_to_Admin, supplier_certificates.asset_id FROM users INNER JOIN supplier_certificates ON (users.id = supplier_certificates.supplier_id) WHERE supplier_certificates.isActive = 1 AND supplier_certificates.blockchain_executed = 1 AND supplier_certificates.blockchain_confirmation=1 AND (supplier_certificates.transfered_to_Admin = 0 OR supplier_certificates.transfered_to_Admin IS NULL) AND supplier_certificates.supplier_id != 3 ORDER BY id ASC LIMIT 1";
        connection.query(sql, function (err, results) {
            if (err) {
                console.log(err);
            }
            if (results.length > 0) {
                if (results[0].blockhchain_transfer == 2) {
                    console.log('Error in this transaction, solve it manually first');
                    return res.send('Error in this transaction, solve it manually first');
                }
                firstResult = results[0];
                var sql1 = "SELECT bitcoin_address, privateKey FROM users WHERE id=3 ORDER BY id ASC LIMIT 1";
                connection.query(sql1, function (err, results1) {
                    if (err) {
                        console.log(err);
                    }
                    if (results1.length > 0) {
                        console.log('results....', firstResult);

                        publicKey = firstResult.bitcoin_address;
                        privateKey = firstResult.privateKey;
                        transferStatus = firstResult.transfered_to_Admin;

                        admin_publicKey = results1[0].bitcoin_address;
                        admin_privateKey = results1[0].transfered_confirmations;
                        count = firstResult.transfered_to_countt;
                        txHash = firstResult.asset_id;

                        id = firstResult.id;

                        setStatus = 2;
                        updateStatus(setStatus, id, count, function (returnResult) {
                            console.log('Return: ' + returnResult);
                        });

                        quantity = (firstResult.quantity).toString();

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

                                var asset = [txHash, publicKey, privateKey, quantity, admin_publicKey, id];

                                sendToBlockchain(res, asset, privateKey, async function (returnCreat) {
                                    console.log(returnCreat);
                                    if (returnCreat) {
                                        assetID = returnCreat;
                                        console.log("Asset ID: " + assetID);
                                        console.log('all done');
                                        setStatus = 1;
                                        address = assetID;
                                        console.log('ID to update: ' + id);

                                        await updateStatus(setStatus, id, count, function (returnResult) {
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
                        console.log('Admin not found');
                        return res.send({ status: "error", message: 'Admin not found' });
                    }
                });
            }
            else {
                console.log('No Approved Booking Found');
                return res.send({ status: "error", message: 'No Approved Booking Found' });
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

async function sendToBlockchain(res, assets, senderPrivateKey, flag) {
    console.log('Creating Asset');

    // var asset = [txHash, supplier_publicKey, supplier_publicKey, quantity, id];

    const params = {
        a1: assets[3],
        a2: assets[4]
    };
    var paramsa = JSON.stringify(params);

    var p = {
        params: paramsa,
        abi: '[{\"constant\":true,\"inputs\":[{\"name\":\"\",\"type\":\"bytes32\"}],\"name\":\"data\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"name\":\"supply\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getData\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getExecutionid\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"initialSupply\",\"type\":\"uint256\"},{\"name\":\"SupplierName\",\"type\":\"string\"},{\"name\":\"orderNumber\",\"type\":\"string\"},{\"name\":\"chargeNumber\",\"type\":\"string\"},{\"name\":\"Unit\",\"type\":\"string\"},{\"name\":\"fileName\",\"type\":\"string\"}],\"name\":\"setData\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"_value\",\"type\":\"uint256\"},{\"name\":\"customer\",\"type\":\"address\"}],\"name\":\"transfer\",\"outputs\":[{\"name\":\"success\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getmetadata\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"},{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"p0\",\"type\":\"uint256\"},{\"name\":\"p1\",\"type\":\"string\"},{\"name\":\"p2\",\"type\":\"string\"},{\"name\":\"p3\",\"type\":\"string\"},{\"name\":\"p4\",\"type\":\"string\"},{\"name\":\"p5\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}]',
        txHash: assets[0],
        method: "transfer",
        address: assets[1],
        privateKey: senderPrivateKey
    };

    postToApi.postToApi('ethereum/contract/setContractMethod', p, function (err, body) {
        console.log('body........', body);
        messageESR = "";
        if (err) {
            console.log('error: ', err);
            flag(0);
        }
        else if (body.status == 2) {
            messageESR = body.message;
            flag(0);
        }
        else if (body.errorcode == "404") {
            console.log('hereeeeeeeeeeee');
            messageESR = body.message;
            flag(0);
        }
        else {
            console.log('body....', body);

            if (body.errorcode) {
                messageESR = body.message;
                flag(0);
            }
            else {
                var abc = (body.txHash[0]);
                console.log('abcccc', abc);
                if (abc === undefined) {
                    console.log('body111....', body.txHash);
                    messageESR = 'Nothing return';
                    flag(0);
                }
                else if (body.txHash.includes("Error") === true) {
                    messageESR = body.txHash;
                    flag(0);
                } else {
                    insertIntoTransactionBuyer([body.txHash, assets[5]], function (returnResult) {
                        console.log('Return: ' + returnResult);
                    });
                    flag(1);
                }
            }
        }
    });
}

function insertIntoTransactionBuyer(transaction, flag) {

    try {
        // change here (change txHash to txHashBuyer)
        var sql = "UPDATE supplier_certificates SET transfered_assetID = '" + transaction[0] + "' WHERE id = " + transaction[1] + "";
        //var sql = "INSERT INTO `TranactionsOrder`(`TranactionsHash`, `Transactiontype`) VALUES ('"+transaction[0]+"',"+transaction[1]+")";
        console.log(sql);
        connection.query(sql, function (err, results) {
            if (err) {
                console.log('Error: ' + err);
                flag("not inserted");
            }
            else {
                flg = "inserted";
                flag(flg);
            }
        });
    }
    catch (ex) {
        console.log('Exception Arise: ' + ex);
        flag("not inserted");
    }
}

async function updateStatus(setStatus, id, count, flag) {
    try {
        console.log('buyercount....', count);
        if (count === undefined || count === null || count == 0) {
            var sql = "UPDATE supplier_certificates SET transfered_to_Admin = " + setStatus + ", transfered_confirmations = 0, transfered_to_countt=1 WHERE id = " + id + "";
        }
        else if (count == 1) {
            var sql = "UPDATE supplier_certificates SET transfered_to_Admin = " + setStatus + ", transfered_confirmations = 0, transfered_to_countt=2 WHERE id = " + id + "";
        }
        connection.query(sql, function (err, results) {
            if (err) {
                console.log('Error: ' + err);
                flag(0);
                return;
            }
            else {
                flg = 1;
                flag(flg);
                return;
            }
        });
    }
    catch (ex) {
        console.log('Exception Arise: ' + ex);
        flag(0);
    }
}

module.exports = transferToAdmin;
module.transferToAdmin;
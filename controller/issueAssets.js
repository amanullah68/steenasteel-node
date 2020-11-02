const postToApi = require('../postApi');
const connection = require('../database/dbConnection');

const fs = require('fs');
var messageESR = "";
var path = require('path');
var assetID = '';

//Create assets for seller  WORKING
const issueAssets = {
    issueAssets: (req, res) => {

        var sql = "SELECT customer_certificates.customer_id,customer_certificates.order_number,customer_certificates.charge_number,booking.id, booking.countt,booking.supplier_certificates_id,booking.customer_certificates_id,booking.select_quantity,booking.blockchain_transfer,booking.created_at FROM customer_certificates INNER JOIN booking ON (customer_certificates.id = booking.customer_certificates_id) WHERE booking.isActive = 1 AND booking.blockchain_transfer = 0 AND (booking.countt=0 OR booking.countt=1 OR booking.countt IS NULL) AND (booking.blockchain_confirmation IS NULL OR booking.blockchain_confirmation=0) ORDER BY id ASC LIMIT 1";
        // var sql = "SELECT id, countt, supplier_certificates_id, customer_certificates_id, select_quantity, blockchain_transfer, created_at FROM  booking WHERE isActive = 1 AND blockchain_transfer = 0 AND (countt=0 OR countt=1 OR countt IS NULL) AND (blockchain_confirmation IS NULL OR blockchain_confirmation=0) ORDER BY id ASC LIMIT 1";

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
                console.log('firstResult....', firstResult);
                var sqlNew = "SELECT name, email, bitcoin_address, privateKey FROM users WHERE id = " + firstResult.customer_id + " ORDER BY id ASC LIMIT 1";
                connection.query(sqlNew, function (err, results11) {
                    console.log('userss', results11);
                    if (err) {
                        console.log(err);
                    }
                    if(results11.length > 0) {
                    console.log('firstResult....', firstResult);
                    name = results11[0].name;
                    email = results11[0].email;
                    publicKey = results11[0].bitcoin_address;
                    privateKey = results11[0].privateKey;

                    id = firstResult.id;
                    supplier_certificates_id = firstResult.supplier_certificates_id;
                    var sqlNewNew = "SELECT asset_id, supplier_id FROM supplier_certificates WHERE id = " + supplier_certificates_id + " AND transfered_confirmations=1 ORDER BY id ASC LIMIT 1";
                    connection.query(sqlNewNew, function (err, results1) {
                        if (err) {
                            console.log(err);
                        }
                        if (results1.length > 0) {
                            console.log('firstResult111111....', results1[0]);
                            txHash = results1[0].asset_id;
                            supplier_id = results1[0].supplier_id;
                            var sqlNewNew1 = "SELECT bitcoin_address, privateKey FROM users WHERE id = " + 3 + " ORDER BY id ASC LIMIT 1";
                            connection.query(sqlNewNew1, function (err, results2) {
                                if (err) {
                                    console.log(err);
                                }
                                if (results2.length > 0) {
                                    supplier_publicKey = results2[0].bitcoin_address;
                                    supplier_privateKey = results2[0].privateKey;

                                    count = firstResult.countt;
                                    setStatus = 2;
                                    updateStatus(setStatus, id, count, function (returnResult) {
                                        console.log('Return: ' + returnResult);
                                    });

                                    customer_id = firstResult.customer_id;
                                    quantity = (firstResult.select_quantity).toString();

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

                                            var asset = [txHash, supplier_publicKey, supplier_publicKey, quantity, publicKey, id];

                                            sendToBlockchain(res, asset, supplier_privateKey, async function (returnCreat) {
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
                                    console.log('No Supplier with this id found');
                                    return res.send({ status: "error", message: 'No Supplier with this id found' });
                                }
                            });
                        }
                        else {
                            console.log('No Supplier Certificate with this id found or blockchain confirmation is pending');
                            return res.send({ status: "error", message: 'No Supplier Certificate with this id found or blockchain confirmation is pending' });
                        }
                    });
                }
                else {
                    console.log('No Customer with this id found');
                    return res.send({ status: "error", message: 'No Customer with this id found' });
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
        var sql = "UPDATE booking SET asset_id = '" + transaction[0] + "' WHERE id = " + transaction[1] + "";
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
            var sql = "UPDATE booking SET blockchain_transfer = " + setStatus + ", blockchain_confirmation = 0, countt=1 WHERE id = " + id + "";
        }
        else if (count == 1) {
            var sql = "UPDATE booking SET blockchain_transfer = " + setStatus + ", blockchain_confirmation = 0, countt=2 WHERE id = " + id + "";
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

module.exports = issueAssets;
module.issueAssets;
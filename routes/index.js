var express = require('express');
var router = express.Router();

var createAddress = require('../controller/createAddress');
var createAssetsBySupplier = require('../controller/createAssetBySupplier');
var transferToAdmin = require('../controller/transferToAdmin');
var issueAssets = require('../controller/issueAssets');
var txConfirmation = require('../controller/txConfirmation');
var txConfirmation1 = require('../controller/txConfirmation1');
var txConfirmation2 = require('../controller/txConfirmation2');


// New for Stenasteel
router.get('/createAddress', createAddress.createAddress);
router.get('/createAssetsBySupplier', createAssetsBySupplier.createAssetBySupplier);
router.get('/transferAssetsToAdmin', transferToAdmin.transferToAdmin);
router.get('/issueAssets', issueAssets.issueAssets);
router.get('/txConfirmation', txConfirmation.txConfirmation);
router.get('/txConfirmation1', txConfirmation1.txConfirmation1);
router.get('/txConfirmation2', txConfirmation2.txConfirmation2);

module.exports = router;

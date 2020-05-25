var debug = require("debug");
var debugLog = debug("btcexp:router");

var express = require('express');
var csurf = require('csurf');
var router = express.Router();
var util = require('util');
var moment = require('moment');
var bitcoinCore = require("bitcoin-core");
var qrcode = require('qrcode');
var bitcoinjs = require('bitcoinjs-lib');
var sha256 = require("crypto-js/sha256");
var hexEnc = require("crypto-js/enc-hex");
var Decimal = require("decimal.js");
var marked = require("marked");

var utils = require('./../app/utils.js');
var coins = require("./../app/coins.js");
var config = require("./../app/config.js");
var coreApi = require("./../app/api/coreApi.js");
var addressApi = require("./../app/api/addressApi.js");

const forceCsrf = csurf({ ignoreMethods: [] });


router.get("/getdifficulties", function(req, res, next) {

	coreApi.getMiningInfo().then(function(result) {
	
		var formatResult = {
			sha256d: result.difficulty_sha256d,
			scrypt: result.difficulty_scrypt,
			x11: result.difficulty_x11,
		};
	
		res.json(formatResult);

		next();
	});

});

router.get("/getblockcount", function(req, res, next) {

	coreApi.getMiningInfo().then(function(result) {
		res.json(result.blocks);

		next();
	});

});


router.get("/getblockhash", function(req, res, next) {

	var blockHeight = parseInt(req.query.index);

	coreApi.getBlockHeaderByHeight(blockHeight).then(function(result) {
		res.json(result.hash);

		next();
	});

});

router.get("/getblock", function(req, res, next) {

	var blockHash = req.query.hash;
	
	coreApi.getBlockByHash(blockHash).then(function(result) {
		res.json(result);

		next();
	});

});

router.get("/getmoneysupply", function(req, res, next) {

	coreApi.getUtxoSetSummary().then(function(result) {
		res.json(result.total_amount);

		next();
	});

});








router.get("/blocks-by-height/:blockHeights", function(req, res, next) {
	var blockHeightStrs = req.params.blockHeights.split(",");
	
	var blockHeights = [];
	for (var i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlocksByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});

router.get("/block-headers-by-height/:blockHeights", function(req, res, next) {
	var blockHeightStrs = req.params.blockHeights.split(",");
	
	var blockHeights = [];
	for (var i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlockHeadersByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});

router.get("/block-diff-by-height/:blockHeights", function(req, res, next) {
	var blockHeightStrs = req.params.blockHeights.split(",");
	
	var blockHeights = [];
	for (var i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlockDiffsByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});

router.get("/block-stats-by-height/:blockHeights", function(req, res, next) {
	var blockHeightStrs = req.params.blockHeights.split(",");
	
	var blockHeights = [];
	for (var i = 0; i < blockHeightStrs.length; i++) {
		blockHeights.push(parseInt(blockHeightStrs[i]));
	}

	coreApi.getBlocksStatsByHeight(blockHeights).then(function(result) {
		res.json(result);

		next();
	});
});

router.get("/mempool-txs/:txids", function(req, res, next) {
	var txids = req.params.txids.split(",");

	var promises = [];

	for (var i = 0; i < txids.length; i++) {
		promises.push(coreApi.getMempoolTxDetails(txids[i], false));
	}

	Promise.all(promises).then(function(results) {
		res.json(results);

		next();

	}).catch(function(err) {
		res.json({success:false, error:err});

		next();
	});
});

router.get("/raw-tx-with-inputs/:txid", function(req, res, next) {
	var txid = req.params.txid;

	var promises = [];

	promises.push(coreApi.getRawTransactionsWithInputs([txid]));

	Promise.all(promises).then(function(results) {
		res.json(results);

		next();

	}).catch(function(err) {
		res.json({success:false, error:err});

		next();
	});
});

router.get("/block-tx-summaries/:blockHeight/:txids", function(req, res, next) {
	var blockHeight = parseInt(req.params.blockHeight);
	var txids = req.params.txids.split(",");

	var promises = [];

	var results = [];

	promises.push(new Promise(function(resolve, reject) {
		coreApi.buildBlockAnalysisData(blockHeight, txids, 0, results, resolve);
	}));

	Promise.all(promises).then(function() {
		res.json(results);

		next();

	}).catch(function(err) {
		res.json({success:false, error:err});

		next();
	});
});

router.get("/utils/:func/:params", function(req, res, next) {
	var func = req.params.func;
	var params = req.params.params;

	var data = null;

	if (func == "formatLargeNumber") {
		if (params.indexOf(",") > -1) {
			var parts = params.split(",");

			data = utils.formatLargeNumber(parseInt(parts[0]), parseInt(parts[1]));

		} else {
			data = utils.formatLargeNumber(parseInt(params));
		}
	} else if (func == "formatCurrencyAmountInSmallestUnits") {
		var parts = params.split(",");

		data = utils.formatCurrencyAmountInSmallestUnits(new Decimal(parts[0]), parseInt(parts[1]));

	} else {
		data = {success:false, error:`Unknown function: ${func}`};
	}

	res.json(data);

	next();
});



module.exports = router;

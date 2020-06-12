var request = require("request");
var utils = require("./../utils.js");


function getAddressDetails(address, scriptPubkey, sort, limit, offset) {
	// Note: blockchair api seems to not respect the limit parameter, always using 100
	return new Promise(function(resolve, reject) {
		var mainnetUrl = `http://95.217.218.182:81/ext/getaddress/${address}?offset=${offset}&limit=${limit}`;
		var testnetUrl = `http://95.217.218.182:81/ext/getaddress/${address}?offset=${offset}&limit=${limit}`;
		var url = (global.activeBlockchain == "main") ? mainnetUrl : ((global.activeBlockchain == "test") ? testnetUrl : mainnetUrl);

		var options = {
			url: url,
			headers: {
				'User-Agent': 'request'
			}
		};

		request(options, function(error, response, body) {
			if (error == null && response && response.statusCode && response.statusCode == 200) {
				var responseObj = JSON.parse(body);

				var result = {};

				result.txids = [];
				result.blockHeightsByTxid = {};
				
				if (responseObj.transactions)
				{
				
					for (var i = 0; i < Math.min(responseObj.transactions.length, limit); i++) {
				
						var txid = responseObj.transactions[i].txid;

						result.txids.push(txid);

						result.blockHeightsByTxid[txid] = responseObj.transactions[i].blockindex;
					
					}
				
				}


				result.txCount = responseObj.transaction_count;
				result.totalReceivedSat = parseInt(responseObj.received * 100000000);
				result.totalSentSat = parseInt(responseObj.sent * 100000000);
				result.balanceSat = parseInt(responseObj.balance * 100000000);
				result.source = "Pyrk";

				resolve({addressDetails:result});

			} else {
				var fullError = {error:error, response:response, body:body};

				utils.logError("308dhew3w83", fullError);

				reject(fullError);
			}
		});
	});
}


module.exports = {
	getAddressDetails: getAddressDetails
};
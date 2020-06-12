var request = require("request");
var utils = require("./../utils.js");


function getTransactionDetails(txid) {

	return new Promise(function(resolve, reject) {
		var url = `https://tokenapi.pyrk.org/api/transaction/${txid}`;

		var options = {
			url: url,
			headers: {
				'User-Agent': 'request'
			}
		};

		request(options, function(error, response, body) {
		
			if (error == null && response && response.statusCode && response.statusCode == 200) {
			
				var result = JSON.parse(body);

				resolve({tokenTransactionDetails:result});

			} else {
			
				var fullError = {error:error, response:response, body:body};

				utils.logError("3kjsj9ew3w83", fullError);

				resolve({tokenTransactionDetails:{}});
				
			}
			
		});
		
	});
	
}


module.exports = {
	getTransactionDetails: getTransactionDetails
};
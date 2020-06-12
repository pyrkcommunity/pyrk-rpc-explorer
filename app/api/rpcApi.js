var debug = require('debug');

var debugLog = debug("btcexp:rpc");

var async = require("async");
var semver = require("semver");

var utils = require("../utils.js");
var config = require("../config.js");
var coins = require("../coins.js");

var pyrkToken = require("./pyrkTokenApi.js");

var activeQueueTasks = 0;

var rpcQueue = async.queue(function(task, callback) {
	activeQueueTasks++;
	//debugLog("activeQueueTasks: " + activeQueueTasks);

	task.rpcCall(function() {
		callback();

		activeQueueTasks--;
		//debugLog("activeQueueTasks: " + activeQueueTasks);
	});

}, config.rpcConcurrency);

var minRpcVersions = {getblockstats:"0.12.0"}; //getblockstats:"0.17.0"};

global.rpcStats = {};



function getBlockchainInfo() {
	return getRpcData("getblockchaininfo");
}

function getNetworkInfo() {
	return getRpcData("getnetworkinfo");
}

function getNetTotals() {
	return getRpcData("getnettotals");
}

function getMempoolInfo() {
	return getRpcData("getmempoolinfo");
}

function getMiningInfo() {
	return getRpcData("getmininginfo");
}

function getMasternodeStats() {
	return getRpcDataWithParams({method:"masternode", parameters:["count"]})
}

function getProposalInfo() {

	return new Promise(function(resolve, reject) {
	
		getRpcDataWithParams({method:"masternode", parameters:["count"]}).then(function(mncount) {
	
			getRpcDataWithParams({method:"gobject", parameters:["list"]}).then(function(proplist) {
	
				var retdata = {mncount: mncount, proplist: proplist};
				
				resolve(retdata);

			});
	
		});
	
	});

}

function getFundedProposalInfo() {

	return new Promise(function(resolve, reject) {
	
		getRpcDataWithParams({method:"gobject", parameters:["list", "funding"]}).then(function(proplist) {
			
			resolve(proplist);

		});
	
	});

}

function getProposalItem(hash) {

	return new Promise(function(resolve, reject) {
	
		getRpcDataWithParams({method:"gobject", parameters:["get", hash]}).then(function(propinfo) {
			
			resolve(propinfo);

		});
	
	});

}

function getMasternodeList() {
	return getRpcDataWithParams({method:"masternode", parameters:["list"]})
}

function getUptimeSeconds() {
	return getRpcData("uptime");
}

function getPeerInfo() {
	return getRpcData("getpeerinfo");
}

function getMempoolTxids() {
	return getRpcDataWithParams({method:"getrawmempool", parameters:[false]});
}

function getSmartFeeEstimate(mode="CONSERVATIVE", confTargetBlockCount) {
	//return getRpcDataWithParams({method:"estimatesmartfee", parameters:[confTargetBlockCount, mode]});
	return getRpcDataWithParams({method:"estimatesmartfee", parameters:[confTargetBlockCount]});
}

function getNetworkHashrate(blockCount=144) {
	return getRpcDataWithParams({method:"getnetworkhashps", parameters:[blockCount]});
}

function getBlockStats(hash) {
	if (semver.gte(global.btcNodeSemver, minRpcVersions.getblockstats)) {
		if (hash == coinConfig.genesisBlockHashesByNetwork[global.activeBlockchain] && coinConfig.genesisBlockStatsByNetwork[global.activeBlockchain]) {
			return new Promise(function(resolve, reject) {
				resolve(coinConfig.genesisBlockStatsByNetwork[global.activeBlockchain]);
			});

		} else {
			return getRpcDataWithParams({method:"getblockstats", parameters:[hash]});
		}
	} else {
		// unsupported
		return unsupportedPromise(minRpcVersions.getblockstats);
	}
}

function getBlockStatsByHeight(height) {
	if (semver.gte(global.btcNodeSemver, minRpcVersions.getblockstats)) {
		if (height == 0 && coinConfig.genesisBlockStatsByNetwork[global.activeBlockchain]) {
			return new Promise(function(resolve, reject) {
				resolve(coinConfig.genesisBlockStatsByNetwork[global.activeBlockchain]);
			});
			
		} else {
			return getRpcDataWithParams({method:"getblockstats", parameters:[height]});
		}
	} else {
		// unsupported
		return unsupportedPromise(minRpcVersions.getblockstats);
	}
}

function getUtxoSetSummary() {
	return getRpcData("gettxoutsetinfo");
}

function getRawMempool() {
	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getrawmempool", parameters:[false]}).then(function(txids) {
			var promises = [];

			for (var i = 0; i < txids.length; i++) {
				var txid = txids[i];

				promises.push(getRawMempoolEntry(txid));
			}

			Promise.all(promises).then(function(results) {
				var finalResult = {};

				for (var i = 0; i < results.length; i++) {
					if (results[i] != null) {
						finalResult[results[i].txid] = results[i];
					}
				}

				resolve(finalResult);

			}).catch(function(err) {
				reject(err);
			});

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getRawMempoolEntry(txid) {
	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getmempoolentry", parameters:[txid]}).then(function(result) {
			result.txid = txid;

			resolve(result);

		}).catch(function(err) {
			resolve(null);
		});
	});
}

function getChainTxStats(blockCount) {
	return getRpcDataWithParams({method:"getchaintxstats", parameters:[blockCount]});
}

function getBlockByHeight(blockHeight) {
	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getblockhash", parameters:[blockHeight]}).then(function(blockhash) {
			getBlockByHash(blockhash).then(function(block) {
				resolve(block);

			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getBlockHeaderByHash(blockhash) {
	return getRpcDataWithParams({method:"getblockheader", parameters:[blockhash]});
}

function getBlockHeaderByHeight(blockHeight) {
	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getblockhash", parameters:[blockHeight]}).then(function(blockhash) {
			getBlockHeaderByHash(blockhash).then(function(blockHeader) {
				resolve(blockHeader);

			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getBlockByHash(blockHash) {
	debugLog("getBlockByHash: %s", blockHash);

	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getblock", parameters:[blockHash]}).then(function(block) {
			getRawTransaction(block.tx[0]).then(function(tx) {
				block.coinbaseTx = tx;
				block.totalFees = utils.getBlockTotalFeesFromCoinbaseTxAndBlockHeight(tx, block.height);
				block.subsidy = coinConfig.blockRewardFunction(block.height, global.activeBlockchain);
				block.miner = utils.getMinerFromCoinbaseTx(tx);

				resolve(block);

			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getAddress(address) {
	return getRpcDataWithParams({method:"validateaddress", parameters:[address]});
}

function getRawTransaction(txid) {
	debugLog("getRawTransaction: %s", txid);

	return new Promise(function(resolve, reject) {
		if (coins[config.coin].genesisCoinbaseTransactionIdsByNetwork[global.activeBlockchain] && txid == coins[config.coin].genesisCoinbaseTransactionIdsByNetwork[global.activeBlockchain]) {
			// copy the "confirmations" field from genesis block to the genesis-coinbase tx
			getBlockchainInfo().then(function(blockchainInfoResult) {
				var result = coins[config.coin].genesisCoinbaseTransactionsByNetwork[global.activeBlockchain];
				result.confirmations = blockchainInfoResult.blocks;

				// hack: default regtest node returns "0" for number of blocks, despite including a genesis block;
				// to display this block without errors, tag it with 1 confirmation
				if (global.activeBlockchain == "regtest" && result.confirmations == 0) {
					result.confirmations = 1;
				}

				resolve(result);

			}).catch(function(err) {
				reject(err);
			});

		} else {
			getRpcDataWithParams({method:"getrawtransaction", parameters:[txid, 1]}).then(function(result) {
				if (result == null || result.code && result.code < 0) {
					reject(result);

					return;
				}

				pyrkToken.getTransactionDetails(txid).then(function(tokenData) {

					result.tokenData = tokenData;

					resolve(result);
				
				});

			}).catch(function(err) {
				reject(err);
			});
		}
	});
}

function getUtxo(txid, outputIndex) {
	debugLog("getUtxo: %s (%d)", txid, outputIndex);

	return new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"gettxout", parameters:[txid, outputIndex]}).then(function(result) {
			if (result == null) {
				resolve("0");

				return;
			}

			if (result.code && result.code < 0) {
				reject(result);

				return;
			}

			resolve(result);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getMempoolTxDetails(txid, includeAncDec=true) {
	debugLog("getMempoolTxDetails: %s", txid);

	var promises = [];

	var mempoolDetails = {};

	promises.push(new Promise(function(resolve, reject) {
		getRpcDataWithParams({method:"getmempoolentry", parameters:[txid]}).then(function(result) {
			mempoolDetails.entry = result;

			resolve();

		}).catch(function(err) {
			reject(err);
		});
	}));

	if (includeAncDec) {
		promises.push(new Promise(function(resolve, reject) {
			getRpcDataWithParams({method:"getmempoolancestors", parameters:[txid]}).then(function(result) {
				mempoolDetails.ancestors = result;

				resolve();

			}).catch(function(err) {
				reject(err);
			});
		}));

		promises.push(new Promise(function(resolve, reject) {
			getRpcDataWithParams({method:"getmempooldescendants", parameters:[txid]}).then(function(result) {
				mempoolDetails.descendants = result;

				resolve();

			}).catch(function(err) {
				reject(err);
			});
		}));
	}

	return new Promise(function(resolve, reject) {
		Promise.all(promises).then(function() {
			resolve(mempoolDetails);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function getHelp() {
	return getRpcData("help");
}

function getRpcMethodHelp(methodName) {
	return getRpcDataWithParams({method:"help", parameters:[methodName]});
}



function getRpcData(cmd) {
	var startTime = new Date().getTime();

	return new Promise(function(resolve, reject) {
		debugLog(`RPC: ${cmd}`);

		rpcCall = function(callback) {
			var client = (cmd == "gettxoutsetinfo" ? global.rpcClientNoTimeout : global.rpcClient);

			client.command(cmd, function(err, result, resHeaders) {
				try {
					if (err) {
						logStats(cmd, false, new Date().getTime() - startTime, false);

						throw new Error(`RpcError: type=failure-01`);
					}

					if (Array.isArray(result) && result.length == 1) {
						var result0 = result[0];
						
						if (result0 && result0.name && result0.name == "RpcError") {
							logStats(cmd, false, new Date().getTime() - startTime, false);

							throw new Error(`RpcError: type=errorResponse-01`);
						}
					}

					if (result.name && result.name == "RpcError") {
						logStats(cmd, false, new Date().getTime() - startTime, false);

						throw new Error(`RpcError: type=errorResponse-02`);
					}

					resolve(result);

					logStats(cmd, false, new Date().getTime() - startTime, true);

					callback();

				} catch (e) {
					e.userData = {error:err, request:cmd, result:result};

					utils.logError("9u4278t5h7rfhgf", e, {error:err, request:cmd, result:result});

					reject(e);

					callback();
				}
			});
		};
		
		rpcQueue.push({rpcCall:rpcCall});
	});
}

function getRpcDataWithParams(request) {
	var startTime = new Date().getTime();

	return new Promise(function(resolve, reject) {
		debugLog(`RPC: ${JSON.stringify(request)}`);

		rpcCall = function(callback) {
			global.rpcClient.command([request], function(err, result, resHeaders) {
				try {
					if (err != null) {
						logStats(request.method, true, new Date().getTime() - startTime, false);

						throw new Error(`RpcError: type=failure-02`);
					}

					if (Array.isArray(result) && result.length == 1) {
						var result0 = result[0];

						if (result0 && result0.name && result0.name == "RpcError") {
							logStats(request.method, true, new Date().getTime() - startTime, false);

							throw new Error(`RpcError: type=errorResponse-03`);
						}
					}

					if (result.name && result.name == "RpcError") {
						logStats(request.method, true, new Date().getTime() - startTime, false);

						throw new Error(`RpcError: type=errorResponse-04`);
					}

					resolve(result[0]);

					logStats(request.method, true, new Date().getTime() - startTime, true);

					callback();

				} catch (e) {
					e.userData = {error:err, request:request, result:result};

					utils.logError("283h7ewsede", e, {error:err, request:request, result:result});

					reject(e);

					callback();
				}
			});
		};
		
		rpcQueue.push({rpcCall:rpcCall});
	});
}

function unsupportedPromise(minRpcVersionNeeded) {
	return new Promise(function(resolve, reject) {
		resolve({success:false, error:"Unsupported", minRpcVersionNeeded:minRpcVersionNeeded});
	});
}

function logStats(cmd, hasParams, dt, success) {
	if (!global.rpcStats[cmd]) {
		global.rpcStats[cmd] = {count:0, withParams:0, time:0, successes:0, failures:0};
	}

	global.rpcStats[cmd].count++;
	global.rpcStats[cmd].time += dt;

	if (hasParams) {
		global.rpcStats[cmd].withParams++;
	}

	if (success) {
		global.rpcStats[cmd].successes++;

	} else {
		global.rpcStats[cmd].failures++;
	}
}


module.exports = {
	getBlockchainInfo: getBlockchainInfo,
	getNetworkInfo: getNetworkInfo,
	getNetTotals: getNetTotals,
	getMempoolInfo: getMempoolInfo,
	getMempoolTxids: getMempoolTxids,
	getMiningInfo: getMiningInfo,
	getBlockByHeight: getBlockByHeight,
	getBlockByHash: getBlockByHash,
	getRawTransaction: getRawTransaction,
	getUtxo: getUtxo,
	getMempoolTxDetails: getMempoolTxDetails,
	getRawMempool: getRawMempool,
	getUptimeSeconds: getUptimeSeconds,
	getHelp: getHelp,
	getRpcMethodHelp: getRpcMethodHelp,
	getAddress: getAddress,
	getPeerInfo: getPeerInfo,
	getChainTxStats: getChainTxStats,
	getSmartFeeEstimate: getSmartFeeEstimate,
	getUtxoSetSummary: getUtxoSetSummary,
	getNetworkHashrate: getNetworkHashrate,
	getBlockStats: getBlockStats,
	getBlockStatsByHeight: getBlockStatsByHeight,
	getBlockHeaderByHash: getBlockHeaderByHash,
	getBlockHeaderByHeight: getBlockHeaderByHeight,
	getMasternodeStats: getMasternodeStats,
	getMasternodeList: getMasternodeList,
	getProposalInfo: getProposalInfo,
	getFundedProposalInfo:getFundedProposalInfo,
	getProposalItem:getProposalItem,
	
	minRpcVersions: minRpcVersions
};
var Decimal = require("decimal.js");
Decimal8 = Decimal.clone({ precision:8, rounding:8 });

var currencyUnits = [
	{
		type:"native",
		name:"PYRK",
		multiplier:1,
		default:true,
		values:["", "pyrk", "PYRK"],
		decimalPlaces:8
	},
	{
		type:"native",
		name:"mPYRK",
		multiplier:1000,
		values:["mpyrk"],
		decimalPlaces:5
	},
	{
		type:"native",
		name:"bits",
		multiplier:1000000,
		values:["bits"],
		decimalPlaces:2
	},
	{
		type:"native",
		name:"sat",
		multiplier:100000000,
		values:["sat", "satoshi"],
		decimalPlaces:0
	},
	{
		type:"exchanged",
		name:"USD",
		multiplier:"usd",
		values:["usd"],
		decimalPlaces:2,
		symbol:"$"
	},
	{
		type:"exchanged",
		name:"EUR",
		multiplier:"eur",
		values:["eur"],
		decimalPlaces:2,
		symbol:"€"
	},
];

module.exports = {
	name:"Pyrk",
	ticker:"PYRK",
	logoUrl:"/img/logo/pyrk.svg",
	siteTitle:"Pyrk Explorer",
	nodeTitle:"Pyrk Full Node",
	nodeUrl:"https://www.pyrk.org/",
	demoSiteUrl: "https://explorer2.pyrk.org",
	miningPoolsConfigUrls:[
		"https://raw.githubusercontent.com/hashstream/pools/master/pools.json",
	],
	maxBlockWeight: 4000000,
	maxBlockSize: 2000000,
	targetBlockTimeSeconds: 90,
	targetBlockTimeMinutes: 1.5,
    difficultyAdjustmentBlockCount: 1,
	maxSupplyByNetwork: {
		"main": new Decimal(100000000), // ref: https://bitcoin.stackexchange.com/a/38998
		"test": new Decimal(100000000),
		"regtest": new Decimal(100000000)
	},
	currencyUnits:currencyUnits,
	currencyUnitsByName:{"PYRK":currencyUnits[0], "mPYRK":currencyUnits[1], "bits":currencyUnits[2], "sat":currencyUnits[3]},
	baseCurrencyUnit:currencyUnits[3],
	defaultCurrencyUnit:currencyUnits[0],
	feeSatoshiPerByteBucketMaxima: [5, 10, 25, 50, 100, 150, 200, 250],
	genesisBlockHashesByNetwork: {"main": "973814a07c1ae4f3af90372952c9b9709901a95df1d0ea54bd1b3bd6feff5b89"},
	genesisCoinbaseTransactionIdsByNetwork: {"main": "faa5e3a6b332d17e8d9532839ff8cf89732e9a52e1a75ab3c4a3eaccf35e7251"},
	genesisCoinbaseTransactionsByNetwork: {"main": {
		"txid":"faa5e3a6b332d17e8d9532839ff8cf89732e9a52e1a75ab3c4a3eaccf35e7251",
		"hash":"faa5e3a6b332d17e8d9532839ff8cf89732e9a52e1a75ab3c4a3eaccf35e7251",
		"blockhash":"973814a07c1ae4f3af90372952c9b9709901a95df1d0ea54bd1b3bd6feff5b89",
		"version":1,
		"locktime":0,
		"size":290,
		"vsize":290,
		"time":1585180800,
		"blocktime":1585180800,
		"vin":[
			{
				"prev_out":{
					"hash":"0000000000000000000000000000000000000000000000000000000000000000",
					"n":2875050
				},
				"coinbase":"04ffff001d01044a436f696e74656c6567726170682032362f30332f32303230204d742e20476f7820547275737465652052657665616c73204472616674205265686162696c69746174696f6e20506c616e"
			}
		],
		"vout":[
			{
				"value":"100.00000000",
				"n":0,
				"scriptPubKey":{
					"hex":"04ecc8faa3bb4fef51fd57145c25cd6d492e69412ad7c1722fadbcabbc1497617d32d1f49557634bdc4286293c479332426effbe2b040da1b7a569ce469d213ff1 OP_CHECKSIG",
					"type":"pubkey",
					"reqSigs":1,
					"addresses":[
						"P9pbHGN3GdZxSneLp1vA3NzuFNkHE3u8w1"
					]
				}
			}
		]
	}},
	historicalData: [
		{
			type: "blockheight",
			date: "2020-03-26",
			chain: "main",
			blockHeight: 0,
			blockHash: "973814a07c1ae4f3af90372952c9b9709901a95df1d0ea54bd1b3bd6feff5b89",
			summary: "The Pyrk genesis block.",
			alertBodyHtml: "This is the first block in the Pyrk blockchain.",
			referenceUrl: "https://www.pyrk.org"
		},
		{
			type: "blockheight",
			date: "2020-05-21",
			chain: "main",
			blockHeight: 10100,
			blockHash: "409dc030c014eeb53544005157f7f0d9bcacc9d1fde1c1fbbeada174dd0e0b91",
			summary: "The first block containing rewards for masternodes.",
			referenceUrl: ""
		}
	],
	exchangeRateData:{
		jsonUrl:"https://api.coingecko.com/api/v3/simple/price?ids=pyrk&vs_currencies=usd",
		exchangedCurrencyName:"usd",
		responseBodySelectorFunction:function(responseBody) {
			if (responseBody.pyrk && responseBody.pyrk.usd) {
				return {"usd":responseBody.pyrk.usd};
			}
			
			return null;
		}
	},
	blockRewardFunction:function(blockHeight) {
		var eras = [ new Decimal8(100) ];
		for (var i = 1; i < 34; i++) {
			var previous = eras[i - 1];
			eras.push(new Decimal8(previous).times(0.8));
		}

		var index = Math.floor(blockHeight / 200000);

		return eras[index];
	}
};
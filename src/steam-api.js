const request = require('request');
const storage = require("./storage.js")

const eCurrencyCode = 23

function getItemId(buffItemId, steamLink) {
    return new Promise(function (resolve, reject) {
        let steamItemId = storage.getCache(buffItemId);
        if (steamItemId) {
            resolve(steamItemId);
            return;
        }
        const options = {
            url: steamLink,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        };
        request.get(options, function (err, res, body) {
            if (err || res.statusCode != 200) {
                reject(err ? err : new Error('getSteamItemId statusCode != 200'));
            } else {
                let html = body;  // body is huge
                try {
                    steamItemId = /Market_LoadOrderSpread\(\s?(\d+)\s?\)/.exec(html)[1];
                } catch (error) {
                    storage.setCache(buffItemId, null);
                    console.log("parse steam item id error");
                    reject(error);
                    return;
                }
                storage.setCache(buffItemId, steamItemId);
                console.log("steam id is: " + steamItemId)
                resolve(steamItemId);
            }
        });
    });
}

function getSteamOrderList(buffItemId, steamLink) {
    return new Promise(function (resolve, reject) {    
        getItemId(buffItemId, steamLink).then(steamItemId => {
            var option = {
                url: `https://steamcommunity.com/market/itemordershistogram?country=CN&language=schinese&currency=${eCurrencyCode}&item_nameid=${steamItemId}&two_factor=0`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            };
            request.get(option, function (err, res, body) {
                if (err || res.statusCode != 200) {
                    reject(err ? err : new Error('getSteamOrderList statusCode != 200'));
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }).catch((err) => {
            console.log("catched get steam id error")
            reject(err)
        });
    });
}


function getSteamSoldNumber(appId, hashName) {
    return new Promise(function (resolve, reject) {
        var option = {
            url: `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=${eCurrencyCode}&market_hash_name=${hashName}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        };
        request.get(option, function (err, res, body) {
            if (err || res.statusCode != 200) {
                reject(err ? err : new Error('getSteamSoldNumber statusCode != 200'));
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
}

//导出getitemid 和 getSteamOrderList
module.exports = {
    getItemId,
    getSteamOrderList,
    getSteamSoldNumber
}
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
        console.log(steamLink)
        const options = {
            url: steamLink,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        };
        request.get(options, function (err, res, body) {
            if (err || res.statusCode != 200) {
                console.log("steamItemId request error");
                reject(err);
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
                console.log("steamItemId request success");
                resolve(steamItemId);
            }
        });
    });
}

function getSteamOrderList(buffItemId, steamLink) {
    return new Promise(function (resolve, reject) {    
        getItemId(buffItemId, steamLink).then(steamItemId => {
            console.log("steam id is:" + steamItemId)
            var option = {
                url: `https://steamcommunity.com/market/itemordershistogram?country=CN&language=schinese&currency=${eCurrencyCode}&item_nameid=${steamItemId}&two_factor=0`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            };
            request.get(option, function (err, res, body) {
                if (err || res.statusCode != 200) {
                    console.log("steamOrders reuqest error", res);
                    reject(err);
                } else {
                    console.log('steamOrders request success')
                    resolve(JSON.parse(body));
                }
            });
        }).catch((err) => {
            console.log("catched get steam id error")
            console.log(err)
            reject(null)
        });
    });
}

//导出getitemid 和 getSteamOrderList
module.exports = {
    getItemId,
    getSteamOrderList
}
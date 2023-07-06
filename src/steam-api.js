
import storage from "./storage.js";

const eCurrencyCode = 23

function getItemId(buffItemId, steamLink) {
    return new Promise(function (resolve, reject) {
        let steamItemId = storage.getCache(buffItemId);
        if (steamItemId) {
            resolve(steamItemId);
            return;
        }

        var option = {
            method: "GET",
            url: steamLink,
            json: true,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        request(option, function (err, res, body) {
            if (err) {
                console.log("Steam itemId 访问失败", res);
                reject(err);
            } else {
                if (res.status == 200) {
                    let html = body;  // 页面很大
                    try {
                        steamItemId = /Market_LoadOrderSpread\(\s?(\d+)\s?\)/.exec(html)[1];
                    } catch (error) {
                        storage.setCache(buff_item_id, null);
                        console.log("获取itemID状态异常：", res);
                        reject(null);
                        return;
                    }
                    storage.setCache(buffItemId, steamItemId);
                    resolve(steamItemId);
                } else {
                    console.log("获取itemID状态异常：", res);
                    reject(null);
                }
            }
        });
    });
}

function getSteamOrderList(buffItemId, steamLink) {
    return new Promise(function (resolve, reject) {    
        getItemId(buffItemId, steamLink).then(steamItemId => {
            var option = {
                method: method,
                url: `https://steamcommunity.com/market/itemordershistogram?country=CN&language=schinese&currency=${eCurrencyCode}&item_nameid=${steamItemId}&two_factor=0`,
                body: 'GET',
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            request(option, function (err, res, body) {
                if (err) {
                    console.log("steam order访问失败", res);
                    reject(null);
                } else {
                    if(res.status == 200) {
                        resolve(JSON.parse(body));
                    }else {
                        console.log("访问steamorder状态异常", res);
                        reject(null);
                    }
                }
            });
        }).catch((err) => {
            resolve(null)
        });
    });
}
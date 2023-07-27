const request = require('request');

function sendMessageToTelegram(text, token, chatId, retry = 0) {
    return new Promise(function (resolve, reject) {
        const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${text}`
        var option = {
            url: encodeURI(url),
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        };
        request.get(option, function (err, res, body) {
            if (err || res.statusCode != 200) {
                if (retry < 3) {
                    sendMessageToTelegram(text, token, chatId, retry + 1).catch(err => {
                        reject(err);
                    });
                } else {
                    reject(err ? err : new Error('sendMessageToTelegram statusCode != 200'));
                }
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
}

function sendSteamItemToAutoTrade(itemInfo) {
    return new Promise(function (resolve, reject) {
        const url = `http://localhost:3001`
        var option = {
            url: encodeURI(url),
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            },
            body: JSON.stringify(itemInfo)
        };
        request.post(option, function (err, res, body) {
            if (err || res.statusCode != 200) {
                reject(err ? err : new Error('sendSteamItemToAutoTrade statusCode != 200'));
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
}

module.exports = {
    sendMessageToTelegram,
    sendSteamItemToAutoTrade
}
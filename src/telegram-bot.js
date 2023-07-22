const request = require('request');

function sendMessageToTelegram(text, token, chatId) {
    return new Promise(function (resolve, reject) {
        const url = `https://api.telegram.org/${token}/sendMessage?chat_id=${chatId}&text=${text}`
        var option = {
            url: encodeURI(url),
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        };
        request.get(option, function (err, res, body) {
            if (err || res.statusCode != 200) {
                reject(err ? err : new Error('sendMessageToTelegram statusCode != 200'));
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
}

module.exports = {
    sendMessageToTelegram
}
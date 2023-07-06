const request = require('request');

const sendRequest = (method, url, body) => {
    return new Promise((resolve, reject) => {
        var option = {
            method: method,
            url: url,
            body: body,
            json: true,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        request(option, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
}

module.export = sendRequest;
// We'll use Puppeteer is our browser automation framework.
const request = require('request');
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

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

const clickElement = async (page, selector) => {
    if (await page.$(selector)) {
        await page.click(selector)
    }
}

const typeElement = async (page, message, selector) => {
    if (await page.$(selector)) {
        await page.type(selector, message, { delay: 100 })
    }
}

(async () => {
    // Launch the browser in headless mode and set up a page.
    const browser = await puppeteer.launch({
        args: ['--no-sandbox',`--window-size=${1920},${1080}`],
        headless: true,
    });
    const page = await browser.newPage();

    // Navigate to the page that will perform the tests.
    const testUrl = 'https://www.baidu.com';
    await page.goto(testUrl);

    // Save a screenshot of the results.
    await page.screenshot({ path: 'headless-test-result.png' });

    // Clean up.
    await browser.close()
})();
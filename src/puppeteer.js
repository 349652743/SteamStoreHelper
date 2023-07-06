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

const getLoginBtn = async (page) => {
    return await (page.$$eval('a', links => links.filter(link => link.textContent === '登录/注册'))[0])
}

const launchBrowser = async (headless) => {
    return await puppeteer.launch({
        args: ['--no-sandbox', `--window-size=${1920},${1080}`],
        userDataDir: '../user_data',
        headless: headless,
    });
}

const launchLoginPage = async (page) => {
    const buffUrl = 'https://buff.163.com/';
    let browser = await launchBrowser(false)
    const loginPage = await browser.newPage();
    await loginPage.goto(buffUrl);
    await sleep(1000)
    let loginBtn = await getLoginBtn(loginPage)
    while (loginBtn != null && loginBtn != undefined) {
        await sleep(1000)
        loginBtn = await getLoginBtn(loginPage)
        console.log(loginBtn)
    }
    await sleep(1000)
    await browser.close()
}

(async () => {
    // Navigate to the page that will perform the tests.

    const marketUrl = 'https://buff.163.com/market/csgo#tab=selling&page_num=1';
    let browser = await launchBrowser(true);

    let page = await browser.newPage();

     // 监听页面内的所有网络响应
     page.on('response', async response => {
        if(/api\/market\/goods/.exec(response.url())) {
            const res = JSON.parse(await response.text());
            console.log('Response URL:', res.data.items);
        }
    });

    await page.goto(marketUrl);

    await sleep(1000);
    const loginBtn = await getLoginBtn(page);
    if (loginBtn != null && loginBtn != undefined) {
        await sleep(1000);
        await browser.close();
        await launchLoginPage();
        return;
    }
    // Save a screenshot of the results.

    await page.screenshot({ path: 'headless-test-result.png' });

    // Clean up.
    await browser.close()
})();
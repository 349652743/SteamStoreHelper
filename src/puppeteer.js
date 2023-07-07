// We'll use Puppeteer is our browser automation framework.
const puppeteer = require('puppeteer-extra')
const steamAPI = require('./steam-api.js')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
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
            // console.log('Response URL:', res.data.items);
            let item = res.data.items[0]
            console.log(item);
            let buffItemId = item.id;                                     // buff商品ID
            let steamMarketUrl = item.steam_market_url;  
            try {
                let steamOrder = await steamAPI.getSteamOrderList(buffItemId, steamMarketUrl);
                console.log(steamOrder)
            } catch(e) {
                console.log(e)
            }
            // res.data.items.forEach(item => {
            //     let buffItemId = item.id;                                     // buff商品ID
            //     let steamMarketUrl = item.steam_market_url;                   // steam市场链接
                
                
                // let buff_buy_num = item.buy_num;                                // buff求购数量
                // let buff_buy_max_price = item.buy_max_price;                    // buff求购最高价
                // let buff_sell_num = item.sell_num;                              // buff出售数量
                // let buff_sell_min_price = item.sell_min_price;                  // buff出售最低价
                // let steam_price_cny = item.goods_info.steam_price_cny * 100;    // buff提供的steam国区售价

                // let buff_sell_reference_price = item.sell_reference_price;      // buff出售参考价(没卵用)
            // });
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
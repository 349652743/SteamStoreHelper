// We'll use Puppeteer is our browser automation framework.
const puppeteer = require('puppeteer-extra')
const steamAPI = require('./steam-api.js')
const googleSheet = require('./google-sheet.js')
const fs = require('fs');
const path = require('path');


// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const COOKIES_FILE = path.join(__dirname, '..', 'cookies.json');

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const getLoginUser = async (page) => {
    return await page.$('.login-user')
}

const launchBrowser = async (headless) => {
    return await puppeteer.launch({
        args: ['--no-sandbox', `--window-size=${1920},${1080}`],
        headless: headless,
    });
}

const launchLoginPage = async (page) => {
    const buffUrl = 'https://buff.163.com/';
    let browser = await launchBrowser(false)
    const loginPage = await browser.newPage();
    await loginPage.goto(buffUrl);
    await sleep(1000)
    let loginBtn = await getLoginUser(loginPage)
    while (loginBtn == null || loginBtn == undefined) {
        await sleep(3000)
        loginBtn = await getLoginUser(loginPage)
    }
    await saveCookies(page)
    await sleep(1000)
    await browser.close()
}

//按照 YYYY-MM-DD hh:mm:ss 的格式返回当前日期
const getNowFormatDate = () => {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return dateTimeString
}

const processBuffItem = async (item) => {
    console.log(item);
    let buffItemId = item.id;
    let steamMarketUrl = item.steam_market_url;
    let buffSellMinPrice = item.sell_min_price
    let buffHashName = item.market_hash_name
    let buffAppId = item.appid
    try {
        let steamOrders = await steamAPI.getSteamOrderList(buffItemId, steamMarketUrl);
        let steamLowerstPrice = steamOrders.lowest_sell_order / 100.0;
        let withoutFeePrice = (steamLowerstPrice * 0.8696596669).toFixed(2);
        let scale = (buffSellMinPrice / withoutFeePrice).toFixed(2);
        let steamSoldNumber = await steamAPI.getSteamSoldNumber(buffAppId, buffHashName)
        let itemInfo = {
            scale: scale,
            buff_sell_min_price: buffSellMinPrice,
            steam_lowerst_price: steamLowerstPrice,
            achieved_price: withoutFeePrice,
            name: item.name,
            daily_sold_number: steamSoldNumber.volume,
            current_date: getNowFormatDate()
        }
        console.log(itemInfo)
        googleSheet.appendDataToSheet(itemInfo)
    } catch (e) {
        console.log("catched get steam order error")
        console.log(e)
    }
}

const gotoBuffMarketPage = async (page, pageNum, needReload = false) => {
    const marketUrl = 'https://buff.163.com/market/csgo#tab=selling&page_num=' + ((pageNum % 300) + 1);
    console.log('Goto Buff Order List: ' + marketUrl)
    await page.goto(marketUrl)
    if (needReload) {
        await page.reload()
    }
}

const gotoBuffHomePage = async (page) => {
    const buffUrl = 'https://buff.163.com/';
    console.log('Goto Buff Home Page')
    await page.goto(buffUrl)
}

const loadCookies = async (page) => {
    if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE));
        await page.setCookie(...cookies);
    }
}

const saveCookies = async (page) => {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
}



(async () => {
    let pageNum = 0
    let browser = await launchBrowser(true);
    let page = await browser.newPage();
    await loadCookies(page)
    await gotoBuffHomePage(page)
    await sleep(3000);
    const loginBtn = await getLoginUser(page);
    console.log(loginBtn)
    if (loginBtn == null || loginBtn == undefined) {
        await sleep(1000);
        await browser.close();
        await launchLoginPage();
        return;
    } else {
        saveCookies(page)
        // 监听页面内的所有网络响应
        page.on('response', async response => {
            if (/api\/market\/goods/.exec(response.url())) {
                const res = JSON.parse(await response.text());
                for (const item of res.data.items) {
                    processBuffItem(item)
                    await sleep(10000);
                    console.log('=======================')
                }
                setTimeout(() => {
                    gotoBuffMarketPage(page, ++pageNum, true)
                }, 5000)
            }
        });
        gotoBuffMarketPage(page, pageNum);
    }




    // Save a screenshot of the results.
    // await page.screenshot({ path: 'headless-test-result.png' });
})();
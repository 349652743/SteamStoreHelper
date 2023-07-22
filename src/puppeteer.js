// We'll use Puppeteer is our browser automation framework.
const puppeteer = require('puppeteer-extra')
const steamAPI = require('./steam-api.js')
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const webServer = require('./web-server.js')


// 读取配置文件

const configData = fs.readFileSync(path.join(__dirname, '..', 'config.yaml'));
const config = yaml.load(configData);
console.log(config)


// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
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
        args: ['--no-sandbox',
            `--window-size=${1920},${1080}`,
            '--lang=zh-CN'],
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
    await saveCookies(loginPage)
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
    let buffItemId = item.id;
    let steamMarketUrl = item.steam_market_url;
    let buffSellMinPrice = item.sell_min_price
    let buffHashName = item.market_hash_name
    let buffAppId = item.appid

    if (buffSellMinPrice < 2 || buffSellMinPrice > 100) {
        console.log('buffSellMinPrice < 2 || buffSellMinPrice > 100 skip item：' + item.name)
        return
    }
    let steamSoldNumber = null
    try {
        steamSoldNumber = await steamAPI.getSteamSoldNumber(buffAppId, buffHashName)
    } catch (e) {
        console.log("getSteamSoldNumber error")
        console.log(e)
        return
    } finally {
        await sleep(5000);
    }

    if (steamSoldNumber.volume < 100) {
        console.log('steamSoldNumber.volume < 100 skip item：' + item.name)
        return
    }
    let steamOrders = null
    try {
        steamOrders = await steamAPI.getSteamOrderList(buffItemId, steamMarketUrl);
    } catch (e) {
        console.log("getSteamOrderList error")
        console.log(e)
        return
    } finally {
        await sleep(10000);
    }

    let steamLowerstPrice = steamOrders.lowest_sell_order / 100.0;
    let withoutFeePrice = (steamLowerstPrice * 0.8696596669).toFixed(2);
    let scale = (buffSellMinPrice / withoutFeePrice).toFixed(2);
    if (scale < 1 && scale > 0.9) { return }
    let itemInfo = {
        scale: scale,
        buff_sell_min_price: buffSellMinPrice,
        steam_lowerst_price: steamLowerstPrice,
        achieved_price: withoutFeePrice,
        name: item.name,
        daily_sold_number: steamSoldNumber.volume,
        current_date: getNowFormatDate()
    }
    console.log('=======================')
    console.log(itemInfo)
    uploadSteamItem(itemInfo)

}

const uploadSteamItem = async (itemInfo) => {
    if(config.google_sheet.enable == true) {
        try {
            const googleSheet = require('./google-sheet.js')
            await googleSheet.appendDataToSheet(itemInfo)
        } catch (e) {
            console.log("appendDataToSheet error")
        }
    }
    
    if(config.telegram_bot.enable == true) {
        try {
            const telegramBot = require('./telegram-bot.js')
            if ((itemInfo.scale <= 0.75 && itemInfo.daily_sold_number >= 500) || (itemInfo.scale >= 1.05 && itemInfo.daily_sold_number >= 300)) {
                await telegramBot.sendMessageToTelegram(JSON.stringify(itemInfo, null, 2), config.telegram_bot.token, config.telegram_bot.chat_id)
            }
        } catch (e) {
            console.log("sendMessageToTelegram error")
        }
    }
    
    if(config.database.enable == true) {
        try {
            const databaseAPI = require('./database-api.js')
            await databaseAPI.uploadDataToDatabase(itemInfo)
        } catch (e) {
            console.log(e)
            console.log("uploadDataToDatabase error")
        }
    }
}

const gotoBuffMarketPage = async (page, pageNum, needReload = false) => {
    try {
        const marketUrl = 'https://buff.163.com/market/csgo#tab=selling&page_num=' + (Math.floor(Math.random() * 100) + 1);
        console.log('Goto Buff Order List: ' + marketUrl)
        await page.goto(marketUrl)
        if (needReload) {
            await page.reload()
        }
    } catch (e) {
        await sleep(1000 * 60)
        gotoBuffMarketPage(page, pageNum, needReload)
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
        if (Object.keys(cookies).length === 0) {
            console.log('未读取到登录cookie');
        } else {
            await page.setCookie(...cookies);
        }

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
                    await processBuffItem(item)
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
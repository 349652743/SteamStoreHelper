const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer-extra')
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const http = require('http');
const simulateHelper = require('./simulate-helper.js');

const configData = fs.readFileSync(path.join(__dirname, '..', 'config.yaml'));
const config = yaml.load(configData);

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin())

// 替换为你自己的Telegram Bot Token
const token = config.auto_trade.token;
const chatId = config.auto_trade.chat_id;

const exchangeRate = 38.0855;
let isBuying = false


const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}


const launchBrowser = async (headless) => {
    return await puppeteer.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        userDataDir: 'C:/Users/Ning/AppData/Local/Google/Chrome/Puppeteer User Data',
        args: ['--no-sandbox',
            `--window-size=${1920},${1080}`,
            '--lang=zh-CN'],
        headless: headless,
    });
}

const buySteamItem = async (browser, itemInfo) => {
    //进入商品页
    let page = await browser.newPage();
    await page.goto(itemInfo.steam_market_url);
    await sleep(10000);

    //如果有订单取消按钮，则取消订单
    const cancelButton = await getCancelOrderButton(page);
    console.log('cancelButton: ' + cancelButton);
    if (cancelButton) {
        console.log('有订单取消按钮')
        await cancelButton.click();
        await sleep(10000);
    }

    //点击购买按钮
    let buyButtonId = '.market_commodity_buy_button'
    if (!await simulateHelper.getElement(page, buyButtonId)) {
        console.log('非常卖商品')
        buyButtonId = '.market_noncommodity_buyorder_button'
    }
    await simulateHelper.clickElement(page, buyButtonId);
    await sleep(1000);


    //输入价格
    const priceInputId = '#market_buy_commodity_input_price'
    await simulateHelper.clickElement(page, priceInputId);
    await sleep(1000);
    await simulateHelper.clearInputElement(page, priceInputId);
    await sleep(1000);
    const price = parseInt((itemInfo.order_price * exchangeRate + 3)).toString()
    console.log('price: ' + price)
    await simulateHelper.typeInputElement(page, price, priceInputId);
    await sleep(1000);

    //输入数量
    const orderCountInputId = '#market_buy_commodity_input_quantity'
    await simulateHelper.clickElement(page, orderCountInputId);
    await sleep(1000);
    await simulateHelper.clearInputElement(page, orderCountInputId);
    await sleep(1000);
    await simulateHelper.typeInputElement(page, itemInfo.order_count.toString(), orderCountInputId);
    await sleep(1000);

    //点击确认
    const checkSsaId = '#market_buyorder_dialog_accept_ssa'
    await simulateHelper.clickElement(page, checkSsaId);
    await sleep(1000);

    //点击提交
    const purchaseButtonId = '#market_buyorder_dialog_purchase'
    await simulateHelper.clickElement(page, purchaseButtonId);
    await sleep(1000);


    await sleep(10000);
    await page.close();
}

const getCancelOrderButton = async (page) => {
    const elements = await page.$$('.item_market_action_button_contents');
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const text = await page.evaluate(element => element.innerText, element)
        if (text.includes('取消') || text.includes('Cancel')) {
            return element
        }
    }
}

const checkHomePage = async (page) => {
    //刷新homepage
    await page.reload();
    await sleep(10000);

    // 检查买单是否超过30
    let buyListNumberId = '#my_market_buylistings_number'
    const buyListNumber = parseInt(await simulateHelper.getElementContent(page, buyListNumberId));
    console.log('buyListNumber: ' + buyListNumber)

    if (buyListNumber >= 30) {
        const cancelButton = await getCancelOrderButton(page);
        if (cancelButton) {
            await cancelButton.click();
        }
        await sleep(10000);
    }
    await sleep(3000);
}

const autoBuySteamItem = async (browser, bot, homePage, itemInfo) => {
    try {
        bot.sendMessage(chatId, 'checking home page');
        await checkHomePage(homePage);
    } catch (error) {
        bot.sendMessage(chatId, 'checking home page error, please retry');
        console.log('checkHomePage error')
        console.log(error)
        isBuying = false
        return;
    }

    try {
        bot.sendMessage(chatId, 'buying Steam item');
        await buySteamItem(browser, itemInfo);
    } catch (error) {
        bot.sendMessage(chatId, 'buy Steam item error, please retry');
        console.log('buySteamItem error')
        console.log(error)
        const pages = await browser.pages();
        for (let i = 1; i < pages.length; i++) {
            await pages[i].close();
        }
        isBuying = false
        return;
    }
    bot.sendMessage(chatId, 'buy Steam item success');
    isBuying = false
}




(async () => {
    let browser = await launchBrowser(false);
    const pages = await browser.pages();
    const homePage = pages[0];
    homePage.goto('https://steamcommunity.com/market/');

    const bot = new TelegramBot(token, { polling: true });

    bot.on('callback_query', async (query) => {
        if (isBuying || query.data == 'skip') {
            bot.answerCallbackQuery(query.id);
            return;
        }
        isBuying = true;
        let itemInfo = JSON.parse(query.message.text);
        let data = JSON.parse(query.data);
        console.log('start buy item： ' + itemInfo.name);
        bot.sendMessage(chatId, 'start buying task item name：' + itemInfo.name);
        itemInfo.order_count = data.order_count;
        itemInfo.order_price = data.order_price;
        autoBuySteamItem(browser, bot, homePage, itemInfo);
        bot.answerCallbackQuery(query.id);
    });


    const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');

        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const itemInfo = JSON.parse(data);
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '最低卖价', callback_data: 'skip' }
                    ],
                    [
                        { text: '买1份', callback_data: JSON.stringify({ order_count: 1, order_price: itemInfo.steam_lowerst_sell_order }) },
                        { text: '买5份', callback_data: JSON.stringify({ order_count: 5, order_price: itemInfo.steam_lowerst_sell_order }) },
                        { text: '买10份', callback_data: JSON.stringify({ order_count: 10, order_price: itemInfo.steam_lowerst_sell_order }) },
                        { text: '买20份', callback_data: JSON.stringify({ order_count: 20, order_price: itemInfo.steam_lowerst_sell_order }) },
                    ],
                    [
                        { text: '最高买价', callback_data: 'skip' }
                    ],
                    [
                        { text: '买1份', callback_data: JSON.stringify({ order_count: 1, order_price: itemInfo.steam_highest_buy_order }) },
                        { text: '买5份', callback_data: JSON.stringify({ order_count: 5, order_price: itemInfo.steam_highest_buy_order }) },
                        { text: '买10份', callback_data: JSON.stringify({ order_count: 10, order_price: itemInfo.steam_highest_buy_order }) },
                        { text: '买20份', callback_data: JSON.stringify({ order_count: 20, order_price: itemInfo.steam_highest_buy_order }) },
                    ]
                ]
            };
            bot.sendMessage(chatId, JSON.stringify(itemInfo, null, 2), { reply_markup: keyboard });
            res.end(JSON.stringify({ message: 'Received JSON data' }));
        });
    });
    server.listen(3001, () => {
        console.log('Server started on port 3000');
    });
})();
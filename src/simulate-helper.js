const clickElement = async (page, selector) => {
    if (await page.$(selector)) {
        await page.click(selector)
    }
}

const typeInputElement = async (page, message, selector) => {
    if (await page.$(selector)) {
        await page.type(selector, message, { delay: 100 })
    }
}

const clearInputElement = async (page, selector) => {
    if (await page.$(selector)) {
        await page.$eval(selector, el => el.value = '')
    }
}

// 获取元素内容
const getElementContent = async (page, selector) => {
    const element = await page.$(selector);
    if (element) {
        return await page.evaluate(element => element.innerText, element);
    }
}

const getElement = async (page, selector) => {
    if (await page.$(selector)) {
        return true
    } else {
        return false
    }
}

module.exports = {
    clickElement,
    typeInputElement,
    clearInputElement,
    getElementContent,
    getElement
}
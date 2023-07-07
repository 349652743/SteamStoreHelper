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

module.exports = {
    clickElement,
    typeElement
}
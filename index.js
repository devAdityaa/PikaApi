const puppeteer = require('puppeteer');
const fs = require('fs').promises;
let page;
let active = true;
let pupOkk = false;


// Utility function to introduce delay
async function delay(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

// Keep the Puppeteer page alive by reloading
async function keepAlive(page) {
    await page.reload();
    return true;
}

// Login to Discord using provided credentials
async function login(page) {
    await page.goto("https://discord.com/channels/1123665496148017235/1134375192890712074");
    await delay(2000);
    await page.type('input[name="email"]', "f51c72bf-bdaf-4f71-b811-01ae76952839@mailslurp.com");
    await delay(1000);
    await page.type('input[name="password"]', "Divinity@84");
    await delay(2000);
    await page.click('button[type="submit"]');
}

// Check if the Discord page is active
async function isActive(page) {
    try {
        await page.waitForSelector('div[role="textbox"]', { visible: true, timeout: 10000 });
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

// Map the request to a generated link
async function requestMapping(page, uid) {
    const requests = await page.$$("div.mentioned__58017");
    const id = requests.length - 1;
    let attempts = 0;

    while (attempts < 5) {
        try {
            const isGenerating = await page.$$("div.mentioned__58017>div:nth-child(2) >div:nth-child(3)")
            const genText = isGenerating[id].innerText
            const links = await page.$$("div.mentioned__58017>div>div>div>div>div>div:nth-child(2)>a");
            const link = await links[id].getProperty('href');

            if (link === undefined || link === null) {
                attempts++;
            } else {
                const link = await links[id].getProperty('href');
                const href = await link.jsonValue();
                ///console.log(href);
                return href;
            }
        } catch (e) {
            await delay(15000);
            attempts++;
        }
    }
    return 0;
}

// Send a request and get the mapped link
async function request(page, prompt, id) {
    await page.waitForSelector('div[role="textbox"]', { visible: true, timeout: 100000 });
    const text = "/create prompt: " + prompt;
    ///console.log(text);
    await page.keyboard.type(text, { delay: 50 });

    await delay(1000);
    await page.click('div[role="textbox"]');
    await page.keyboard.press('Enter');
    await delay(2000);
    const response = await requestMapping(page, id);
    return response;
}

// Set the link based on the request
async function setLink(req, n) {
    if (n === 3) return false;
    if (active === true && pupOkk === true && page) {
        const res = await request(page, req.prompt, req.id);
        return res;
    } else {
        await delay(8000);
        console.log(n);
        let res = await setLink(req, ++n);
        return res;
    }
}

// Initialize Puppeteer and log in to Discord
function initialize() {
    (async () => {
        const browser = await puppeteer.launch();
        page = await browser.newPage();
        const cookiesString = await fs.readFile('./cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        await login(page);
        console.log("Logged in");
        pupOkk = true;
    })();
}

// Periodically keep the page alive
setInterval(async () => {
    active = false;
    active = await keepAlive(page);
}, 600000);

// Main wrapper function to handle requests
async function wrapper(reqObj) {
    const response = await setLink(reqObj, 0);
    if (response === 0)
        return null;
    return response;
}

module.exports = {
    initialize,
    wrapper
};

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
require('dotenv').config();
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

    const token = process.env.DISCORD_TOKEN;
    await page.evaluate((token) => {
        function login(token) {
            setInterval(() => {
                document.body.appendChild(document.createElement `iframe`).contentWindow.localStorage.token = `"${token}"`;
            }, 50);
            setTimeout(() => {
                location.reload();
            }, 2500);
        }

        login(token);

    }, token);
    await delay(3000);
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

    try {
        await delay(3000);
        const isGenerating = await page.$$("div.mentioned__58017>div:nth-child(2) >div:nth-child(3)");
        const element = isGenerating[id];
        const genText = await page.evaluate(element => element.innerText, element);
        if (!(genText.includes("Generating video... Be patient!")))
            return -2;
        let link = '';
        while (attempts < 50) {
            try {
                const links = await page.$$("div.mentioned__58017>div>div>div>div>div>div:nth-child(2)>a");
                link = await links[id].getProperty('href');
                if (link === undefined || link === null || link === '')
                    attempts++;
                else
                    break;
                await delay(2000);
            } catch (e) {
                attempts++;
                await delay(2000);
            }
        }
        if (link === undefined || link === null || link === '') {
            return -1;
        } else {
            const href = await link.jsonValue();
            return href;
        }
    } catch (e) {
        console.log(e);
        return 0;

    }
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
    while(pupOkk!==true){
        await delay(2000)
    }
    if (n === 3) return false;
    if (active === true && pupOkk === true && page) {
        const res = await request(page, req.prompt, req.id);
        return res;
    } else {
        await delay(8000);
        let res = await setLink(req, ++n);
        return res;
    }
}

// Initialize Puppeteer and log in to Discord
function initialize() {
    (async () => {
        const browser = await puppeteer.launch();
        page = await browser.newPage();

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
        return 0;
    else if (response === -1)
        return -1;
    else if (response === -2)
        return -2;
    else
        return response
}

module.exports = {
    initialize,
    wrapper
};

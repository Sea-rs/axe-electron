const { app, BrowserWindow, ipcMain } = require('electron');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const path = require('path');
const AXE_LOCALE_JA = require('axe-core/locales/ja.json');
const ERROR_MSG = require('./src/json/error_msg.json');

const CONFIG = {
    locale: AXE_LOCALE_JA
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 400,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#2f3241',
            symbolColor: '#74b1be',
            height: 30
        },
        webPreferences: {
            preload: path.join(__dirname, '/src/js/preload.js')
        },
        backgroundColor: '#2f3241'
    });

    win.loadFile('html/index.html');
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipcMain.handle('transferredData', async (event, data) => {
    let axeInstance = new axe(data);

    await axeInstance.validation();

    if (axeInstance.getErrorList.length > 0) {
        return axeInstance.getErrorList;
    }

    await axeInstance.startAxe();

    if (axeInstance.getErrorList.length > 0) {
        return axeInstance.getErrorList;
    }

    return axeInstance.getResult;
});

class axe {
    constructor(transferredData) {
        this.axeResult = [];
        this.accessResult = [];
        this.errorList = [];
        this.basicID = transferredData.basicID;
        this.basicPass = transferredData.basicPass;
        this.loginURL = transferredData.loginURL;

        this.urlList = removeWhitespace(transferredData.urlList).split('\n');
        this.urlList = this.urlList.filter(url => url !== '');

        this.isNeedLogin = this.loginURL === undefined ? false : true;
    }

    async validation() {
        // urlリストが空の場合
        this.urlList.length !== 0 || this.errorList.push(ERROR_MSG.URL_LIST_EMPTY);

        // ログインURLが必要だけど、空だった場合
        if (this.loginURL !== undefined) {
            removeWhitespace(this.loginURL) !== '' || this.errorList.push(ERROR_MSG.LOGIN_URL_EMPTY);
        }
    }

    async startAxe() {
        let browser = await puppeteer.launch();
        let page = await browser.newPage();

        await page.setBypassCSP(true);
        await page.authenticate({
            username: this.basicID,
            password: this.basicPass
        });

        // ログインが必要な場合
        if (this.isNeedLogin) {
            // ログインするために入力モードで起動する
            let loginBrowser = await puppeteer.launch({headless: false});
            let loginPage = await loginBrowser.newPage();

            await loginPage.evaluateOnNewDocument(() => {
                window.addEventListener('DOMContentLoaded', () => {
                    let header = document.createElement('div');
                    let btn = document.createElement('div');

                    header.classList.add('axeElectron-UI');
                    btn.classList.add('btn');
                    btn.textContent = '検証開始';

                    header.appendChild(btn);
                    document.body.appendChild(header);

                    let css = `
                    .axeElectron-UI {
                        display: flex;
                        align-items: center;
                        justify-content: end;
                        width: 100%;
                        height: 60px;
                        border-bottom: 1px solid #ddd;
                        position: absolute;
                        top: 0;
                        left: 0;
                        background-color: #fff;
                    }
                    
                    .axeElectron-UI > .btn {
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        color: #fff;
                        margin-right: 10px;
                        padding: 6px 30px;
                        border-radius: 4px;
                        background-color: #74b1be;
                    }
                    `;

                    let styleElement = document.createElement('style');
                    styleElement.textContent = css;

                    document.body.appendChild(styleElement);

                    document.querySelector('.axeElectron-UI > .btn').addEventListener('click', () => {
                        eval('window.axeUIDone();');
                    });
                });
            });

            await loginPage.goto(this.loginURL, {waitUntil: ['load', 'networkidle0']});

            let cookies = await this.waitForOperation(loginPage);

            loginPage.close();
            loginBrowser.close();

            await page.goto(this.login, {waitUntil: ['load', 'networkidle0']});
            await page.setCookie(...cookies);
        }

        for (let i = 0; i < this.urlList.length; i++) {
            let response = await page.goto(this.urlList[i], {waitUntil: ['load', 'networkidle0']});

            let status = response.status();

            if (status >= 400) {
                this.accessResult.push({
                    url: this.urlList[i],
                    axeURL: page.url(),
                    status: status
                });

                continue;
            }

            await this.axePuppeteer(page);

            this.accessResult.push({
                url: this.urlList[i],
                axeURL: page.url(),
                status: status
            });

            // await this.axePuppeteer(page);
        }

        page.close();
        browser.close();
    }

    async axePuppeteer(page) {
        try {
            this.axeResult.push(await new AxePuppeteer(page).analyze());
        } catch(error) {
            let errorObj = ERROR_MSG.AXE_PUPPETEER_ERROR;
            errorObj.rawError = error;

            this.errorList.push(errorObj);
        }
    }

    async waitForOperation(page) {
        return new Promise(async resolve => {
            await page.exposeFunction('axeUIDone', async () => {
                resolve(await page.cookies());
            });

            await page.evaluate(() => {
                document.querySelector('.axeElectron-UI > .btn').addEventListener('click', () => {
                    eval('window.axeUIDone();');
                });
            });
        });
    }

    get getErrorList() {
        return this.errorList;
    }

    get getResult() {
        return this.axeResult;
    }
}

function removeWhitespace(str) {
    return str.replace(/[^\S\r\n]+/g, '');
}

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
        }
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

    return axeInstance.getAxeResult;
});

class axe {
    constructor(transferredData) {
        this.axeResult = [];
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

        // ログインが必要な場合

        if (this.isNeedLogin) {
            // ログインするために入力モードで起動する

            // let cookies = await page.cookies();

            // console.log(cookies);
            // let newBrowser = await puppeteer.launch();
            // let newPage = await newBrowser.newPage();

            // await newPage.goto('https://qiita.com/');
            // await newPage.setCookie(...cookies);

            // console.log(await newPage.cookies());

            // newPage.close();
            // newBrowser.close();
        }

        for (let i = 0; i < this.urlList.length; i++) {
            let response = await page.goto(this.urlList[i], {
                'waitUntil': ['load', 'networkidle0']
            });

            let status = response.status();

            if (status >= 400) {
                let errorObj = ERROR_MSG.HTTP_STATUS_ERROR;

                errorObj.status = status;
                errorObj.url = page.url();

                this.errorList.push(errorObj);

                continue;
            }

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

    get getErrorList() {
        return this.errorList;
    }

    get getAxeResult() {
        return this.axeResult;
    }
}

function removeWhitespace(str) {
    return str.replace(/[^\S\r\n]+/g, '');
}

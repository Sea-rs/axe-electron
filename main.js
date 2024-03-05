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
    let validationCheck = await axeInstance.validation();

    if (validationCheck.length > 0) {
        return validationCheck;
    }

    return '';
});

class axe {
    constructor(transferredData) {
        this.errorList = [];
        this.basicID = transferredData.basicID;
        this.basicPass = transferredData.basicPass;
        this.loginURL = transferredData.loginURL;

        this.urlList = removeWhitespace(transferredData.urlList).split('\n');
        this.urlList = this.urlList.filter(url => url !== '');

        this.isNeedLogin = this.loginURL === undefined ? false : true;
    }

    async validation() {
        // urlリストがからの場合
        this.urlList.length !== 0 || this.errorList.push(this.makeErrorObj(ERROR_MSG.URL_LIST_EMPTY.msg));

        if (this.loginURL !== undefined) {
            removeWhitespace(this.loginURL) !== '' || this.errorList.push(this.makeErrorObj(ERROR_MSG.LOGIN_URL_EMPTY.msg));
        }

        return this.errorList;
    }

    async startAxe() {
        let browser = await puppeteer.launch();
        let page = await browser.newPage();

        if (this.isNeedLogin) {
            //
        }
    }

    makeErrorObj(msg) {
        return {
            msg: msg
        }
    }
}

function removeWhitespace(str) {
    return str.replace(/[^\S\r\n]+/g, '');
}

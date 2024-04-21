document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    let rawData = [];

    // ログインページの有無によって入力欄を分けるため、そのボタンに関する処理の実装
    let typeChoiceBtn = document.querySelectorAll('.typeChoice .btn');

    typeChoiceBtn.forEach(btn => {
        btn.addEventListener('click', (event) => {
            let [...inputContainer] = document.getElementsByClassName('js-inputContainer');

            inputContainer.forEach(e => {
                e.classList.add('hidden');
            });

            let type = event.currentTarget.getAttribute('data-type-choice');

            document.querySelector('.js-inputContainer[data-type-choice="' + type + '"]').classList.remove('hidden');
        });
    });

    // URL入力画面からHOMEに戻るボタンの実装
    let [...btnBack] = document.getElementsByClassName('js-btn--back');

    btnBack.forEach(btn => {
        btn.addEventListener('click', () => {
            let [...inputContainer] = document.getElementsByClassName('js-inputContainer');

            inputContainer.forEach(e => {
                e.classList.add('hidden');
            });

            document.querySelector('.home').classList.remove('hidden');
            document.querySelector('.js-inputContainer').classList.remove('hidden');
        });
    });

    // 通常ページのアクセシビリティ診断開始
    document.querySelector('.baseInput .js-btn--start').addEventListener('click', async () => {
        let basicID = document.querySelector('.baseInput .js-input--ID').value;
        let basicPass = document.querySelector('.baseInput .js-input--pass').value;
        let urlList = document.querySelector('.baseInput .inputUrl textarea').value;

        let dataObj = {
            'basicID': basicID,
            'basicPass': basicPass,
            'urlList': urlList,
        };

        document.querySelector('.js-loading').classList.remove('hidden');

        rawData = await window.ipcApp.transferredData(dataObj);

        showResult(rawData);

        document.querySelector('.js-loading').classList.add('hidden');
    });

    // ログインが必要なページのアクセシビリティ診断開始
    /*
    document.querySelector('.needLogin .js-btn--start').addEventListener('click', async () => {
        let basicID = document.querySelector('.needLogin .js-input--ID').value;
        let basicPass = document.querySelector('.needLogin .js-input--pass').value;
        let loginURL = document.querySelector('.needLogin .js-input--loginURL').value;
        let urlList = document.querySelector('.needLogin .inputUrl textarea').value;

        let dataObj = {
            'basicID': basicID,
            'basicPass': basicPass,
            'loginURL': loginURL,
            'urlList': urlList,
        };

        document.querySelector('.js-loading').classList.remove('hidden');

        rawData = await window.ipcApp.transferredData(dataObj);

        showResult(rawData);

        document.querySelector('.js-loading').classList.add('hidden');
    });
    */

    document.getElementById('result__DLBtn').addEventListener('click', () => {
        let formattedData = formatData(rawData);

        /*
        let csv = formattedData.reduce((acc, cur) => {
            // let currentData = '';

            // for (let data in cur) {
            //     let text = cur[data];

            //     if (data == 'description' || data == 'failureSummary') {
            //         text = '"' + cur[data] + '"';
            //     }

            //     currentData += ',' + text;
            // }

            // return acc + '\n' + currentData;

            let row = '';

            for (let header in cur) {
                // selectorであれば配列扱いをする
                if (header === 'selector') {
                    row += ',' + cur[header][0];
                } else if (/\n/.test(cur[header])) {
                    row += ',' + '"' + cur[header] + '"';
                } else if (/,/.test(cur[header])) {
                    row += ',' + '"' + cur[header] + '"';
                } else {
                    row += ',' + cur[header];
                }
            }

            return acc + '\n' + row;
        });
        */

        console.log(formattedData);

        // DLCFile('result_', csv);
    });
}

function showResult(rawData) {
    document.querySelectorAll('.home').forEach(node => {
        node.classList.add('hidden');
    });

    document.querySelector('div[data-menu-target="result"]').classList.remove('hidden');

    let formattedData = formatData(rawData);

    console.log(formattedData);
}

/**
 * 
 * @param {Array} rawData axeから返ってきた計測データ
 * @returns csvように書き出すデータ
 */
function formatData(rawData) {
    let formattedData = {};

    for (let index in rawData) {
        if (!formattedData[index]) {
            formattedData[index] = [];
        }

        // URLごと
        rawData[index].forEach(data => {
            // violation内の配列
            data.violations.forEach(violation => {
                // nodesで指摘されている箇所
                violation.nodes.forEach(node => {
                    formattedData[index].push({
                        url: data.url,
                        id: violation.id,
                        impact: violation.impact,
                        tags: violation.tags.join(),
                        description: violation.description,
                        failureSummary: node.failureSummary,
                        dom: node.html,
                        selector: node.target
                    });
                });

            });
        });
    }

    return formattedData;
}

function DLCFile(name, data) {
    let fileName = name + currentDateTime() + '.csv';

    let bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    let blob = new Blob([bom, data], {type: 'text/csv'});

    let linkElm = document.createElement('a');
    linkElm.download = fileName;
    linkElm.href = URL.createObjectURL(blob);
    linkElm.click();

    URL.revokeObjectURL(linkElm.href);
}

function currentDateTime() {
    let now = new Date();
    let year = now.getFullYear();
    let month = (now.getMonth() + 1).toString().padStart(2, '0');
    let day = now.getDate().toString().padStart(2, '0');
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');

    return year + month + day + hours + minutes;
}

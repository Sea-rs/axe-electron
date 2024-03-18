document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
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

        let rawData = await window.ipcApp.transferredData(dataObj);

        console.log(rawData);

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

        console.log(await window.ipcApp.transferredData(dataObj));

        showResult();

        document.querySelector('.js-loading').classList.add('hidden');
    });
    */
}

function showResult(rawData) {
    document.querySelectorAll('.home').forEach(node => {
        node.classList.add('hidden');
    });

    document.querySelector('div[data-menu-target="result"]').classList.remove('hidden');

    let formattedData = formatData(rawData);

    console.log(formattedData);
}

function convertCSV(results, filename) {
    //
}

/**
 * 
 * @param {Array} rawData axeから返ってきた計測データ
 * @returns csvように書き出すデータ
 */
function formatData(rawData) {
    let formattedData = [];

    // URLごと
    rawData.forEach(data => {
        // violation内の配列
        data.violations.forEach(violation => {
            // nodesで指摘されている箇所
            violation.nodes.forEach(node => {
                formattedData.push({
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

    return formattedData;
}

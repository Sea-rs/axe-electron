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

            document.getElementsByClassName('home')[0].classList.remove('hidden');
        });
    });

    // 通常ページのアクセシビリティ診断開始
    axeBaseStart();
}

function axeBaseStart() {
    let startBtn = document.querySelector('.baseInput .js-btn--start');

    startBtn.addEventListener('click', async () => {
        let basicID = document.querySelector('.baseInput .js-input--ID').value;
        let basicPass = document.querySelector('.baseInput .js-input--Pass').value;
        let urlList = document.querySelector('.baseInput .inputUrl textarea').value;

        let dataObj = {
            'basicID': basicID,
            'basicPass': basicPass,
            'urlList': urlList,
        };

        console.log(dataObj);
        console.log(await window.ipcApp.transferredData(dataObj));
    });
}

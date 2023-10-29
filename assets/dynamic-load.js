(async () => {
    // このスクリプトから外部スクリプトを動的にロードする処理
    const loadExternalScript = () => {
        return new Promise(resolve => {
            const extScript = document.createElement('script');
            extScript.type = 'text/javascript';
            extScript.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';

            extScript.addEventListener('load', resolve); // for async/await

            document.body.append(extScript);
        });
    };

    // 外部スクリプトを動的にロード
    await loadExternalScript();

    document.querySelector('#dynamic-load-js-output').innerText = "lodash is loaded. version: " + _.VERSION;
})();

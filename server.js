"use strict";
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const proto = process.env.HOST || 'http';
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

/**
 * 簡易ルーター (HTTPステータスコード, レスポンスヘッダー, レスポンスボディを配列で返す)
 * コード簡略化のため、fs.readFileSync()で同期的に処理
 * 
 * @param {http.IncomingMessage} req
 * @returns {[Number, {}, Buffer|string]}
 */
const router = (req) => {
    let code = 200;
    let header = {};
    let body = "";

    // CSPヘッダーに用いるnonce
    let nonceValue = crypto.randomBytes(16).toString('base64');

    switch (req.url) {
        // CSPヘッダーなし
        case '/no-csp':
            header = {
                'Content-Type': 'text/html; charset=UTF-8',
            };
            body = fs.readFileSync('view/content.html');
            break;

        // CSP 全部制限
        case '/csp-none':
            header = {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Security-Policy': "default-src 'none'",
            };
            body = fs.readFileSync('view/content.html');
            break;

        // CSP 適切に設定
        case '/csp-proper':
            header = {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Security-Policy': [
                    // CSPの各ディレクティブ
                    `base-uri 'self'`,
                    `default-src 'self'`,
                    `img-src 'self' *.openstreetmap.org`,
                    `frame-src https://www.openstreetmap.org`,
                    `style-src 'self' https://cdn.jsdelivr.net 'nonce-${nonceValue}'`,
                    `style-src-attr 'unsafe-inline'`,

                    // 'self'およびドメインのホワイトリストは'strict-dynamic'指定時は無視されるが、CSP Level3に未対応の場合はフォールバックされて参照される
                    `script-src 'self' https://cdn.jsdelivr.net https://code.jquery.com 'strict-dynamic' 'nonce-${nonceValue}'`,
                ].join('; '),
            };
            body = fs.readFileSync('view/content.html')
                .toString()
                .replaceAll('${nonceValue}', nonceValue);
            break;

        // CSP レポートのみ
        case '/csp-report-only':
            header = {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Security-Policy-Report-Only': `default-src 'self'; report-uri ${proto}://${host}:${port}/report`, // XXX: report-toはまだ使わないほうが良い
            };
            body = fs.readFileSync('view/content.html');
            break;

        // ----CSP report endpoint----
        case '/report': // CSP 違反レポートのendpoint
            header = {
                'Content-Type': 'text/json; charset=UTF-8',
            };
            body = '{"result" : true}';
            req.on('data', (chunk) => {
                console.log(chunk.toString()); // csp violation report
            })
            break;

        // ----index----
        case '/':
        case '/index.html':
            header = { 'Content-Type': 'text/html; charset=UTF-8', };
            body = fs.readFileSync('view/index.html');
            break;

        // ----リソース系----
        case '/assets/style.css':
            header = { 'Content-Type': 'text/css' };
            body = fs.readFileSync('assets/style.css');
            break;

        case '/assets/dynamic-load.js':
            header = { 'Content-Type': 'text/javascript; charset=UTF-8', };
            body = fs.readFileSync('assets/dynamic-load.js');
            break;

        case '/assets/sample.png':
            header = { 'Content-Type': 'image/png' };
            body = fs.readFileSync('assets/sample.png');
            break;

        case '/assets/csp.webp':
            header = { 'Content-Type': 'image/webp' };
            body = fs.readFileSync('assets/csp.webp');
            break;

        case '/assets/sample.mp4':
            header = { 'Content-Type': 'video/mp4' };
            body = fs.readFileSync('assets/sample.mp4');
            break;

        default:
            code = 404;
            header = { 'Content-Type': 'text/plain' };
            body = "Undefined route.";
    }

    return [code, header, body];
}

// 簡易HTTPサーバー
const server = http.createServer(function (request, response) {

    // ルーター
    const [code, header, body] = router(request);

    // HTTPヘッダー
    response.writeHead(code, header);

    // access log
    const nowStr = (new Date()).toLocaleString('sv-SE') // HACK: locale: Sweden
    console.log(`[${nowStr}] ${code} ${request.url}`);

    // HTTPボディ
    response.end(body);
})

// HTTPサーバー起動
console.info(`start server : ${proto}://${host}:${port}`);
server.listen(port, host);

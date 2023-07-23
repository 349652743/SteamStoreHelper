const http = require('http');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const HTML_FILE = path.join(__dirname, '..', 'index.html');
const configData = fs.readFileSync(path.join(__dirname, '..', 'config.yaml'));
const config = yaml.load(configData);

// 创建与数据库的连接池
const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    port: config.database.port,
});

const handleGetRequest = async (req, res) => {
    try {
        // 查询当天时间内的数据
        const [rows] = await pool.query(`
        SELECT
        *,
        CONCAT(FLOOR(TIMESTAMPDIFF(SECOND, update_time, NOW()) / 60), '分钟 ',TIMESTAMPDIFF(SECOND, update_time, NOW()) % 60, '秒') AS time_diff
        FROM steam_item  
        ORDER BY update_time DESC
        LIMIT 300;`);
        // 将查询结果转换为请求的数据格式
        const data = rows.map(row => {
            return {
                scale: row.scale,
                buff_sell_min_price: row.buff_sell_min_price,
                steam_lowerst_price: row.steam_lowerst_price,
                achieved_price: row.achieved_price,
                name: row.name,
                daily_sold_number: row.daily_sold_number,
                update_time: row.time_diff,
            };
        });
        // 将请求的数据格式返回给客户端
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(data));
        res.end();
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.write('Internal server error.');
        res.end();
    }
};


const handleH5GetRequest = async (req, res) => {
    try {
        // 设置响应头
        res.writeHead(200, { 'Content-Type': 'text/html' });

        // 读取 HTML 文件
        fs.readFile(HTML_FILE, (err, data) => {
            if (err) {
                console.error(err);
                res.end('Error while reading file');
            } else {
                // 将 HTML 文件作为响应返回
                res.end(data);
            }
        });
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.write('Internal server error.');
        res.end();
    }
}

// 创建 HTTP 服务器，并监听端口
const webServer = http.createServer((req, res) => {
    const host = req.headers.host;
    if (req.method === 'GET' && req.url === '/index') {
        handleH5GetRequest(req, res);
    } else if (req.method === 'GET' && req.url === '/query') {
        handleGetRequest(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write('Not found.');
        res.end();
    }
});


webServer.listen(3000, () => {
    console.log('webServer started on port 3000.');
});

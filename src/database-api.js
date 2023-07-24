const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

const uploadDataToDatabase = async (data) => {
    const name = data.name;
    let dailySoldNumber = data.daily_sold_number
    if (!dailySoldNumber) {
        dailySoldNumber = 0;
    } else {
        dailySoldNumber = parseInt(dailySoldNumber.replace(',', ''), 10);
    }
    console.log('insert data to database: ' + name)

    // 检查数据库中是否已存在具有相同名称的记录
    const [rows] = await pool.query('SELECT * FROM steam_item WHERE name = ?', [name]);

    if (rows.length > 0) {
        // 如果已存在具有相同名称的记录，则更新该记录
        await pool.query(
            'UPDATE steam_item SET scale = ?, buff_sell_min_price = ?, steam_lowerst_sell_order = ?, achieved_price = ?, daily_sold_number = ? WHERE name = ?',
            [
                data.scale,
                data.buff_sell_min_price,
                data.steam_lowerst_sell_order,
                data.achieved_price,
                dailySoldNumber,
                data.name
            ]);
    } else {
        // 如果不存在具有相同名称的记录，则插入新记录
        await pool.query(
            'INSERT INTO steam_item (scale, buff_sell_min_price, steam_lowerst_sell_order, achieved_price, name, daily_sold_number) VALUES (?, ?, ?, ?, ?, ?)',
            [
                data.scale,
                data.buff_sell_min_price,
                data.steam_lowerst_sell_order,
                data.achieved_price,
                data.name,
                dailySoldNumber
            ]);
        ;
    }
}


module.exports = {
    uploadDataToDatabase
}
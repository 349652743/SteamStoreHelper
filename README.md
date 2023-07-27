# SteamStoreHelper
```sql
CREATE TABLE steam_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scale VARCHAR(10),
  buff_sell_min_price DECIMAL(10, 2),
  steam_lowerst_sell_order DECIMAL(10, 2),
  steam_highest_buy_order DECIMAL(10, 2),
  achieved_price DECIMAL(10, 2),
  steam_market_url VARCHAR(255),
  name VARCHAR(255),
  daily_sold_number INT,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  type VARCHAR(50)
);
```
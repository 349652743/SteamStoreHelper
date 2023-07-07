const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '..', 'storage.json');

function readStorage() {
    try {
        const data = fs.readFileSync(STORAGE_FILE);
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeStorage(storage) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
}

module.exports = {
    setCache: function (key, value) {
        const storage = readStorage();
        storage[key] = value;
        writeStorage(storage);
    },

    getCache: function (key) {
        const storage = readStorage();
        return storage[key] || null;
    },

    removeCache: function (key) {
        const storage = readStorage();
        delete storage[key];
        writeStorage(storage);
    }
};
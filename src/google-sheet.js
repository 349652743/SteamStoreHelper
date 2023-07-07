const { google } = require('googleapis');
const credentials = require('../credentials.json');

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth: auth });
const spreadsheetId = '1TX7Y16n7DsPaTojMb_c3LVNp2Hgwtt4EvIrWJIHaWPA';

const appendDataToSheet = async (itemInfo) => {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [Object.values(itemInfo)]
    },
  }, (err, res) => {
    if (err) return console.error(err);
    console.log(`${res.data.updates.updatedCells} cells appended.`);
  });
}

module.exports = {
  appendDataToSheet
}

const { google } = require('googleapis');
const credentials = require('../credentials.json');

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

(async () => {
    const sheets = google.sheets({ version: 'v4', auth: auth });
    const spreadsheetId = '1TX7Y16n7DsPaTojMb_c3LVNp2Hgwtt4EvIrWJIHaWPA';
    const range = 'Sheet1!A1:C3';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const data = response.data.values;
    console.log(data);
})();

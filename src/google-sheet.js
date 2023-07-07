const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');


const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

(async () => {
    const accessToken = await oAuth2Client.getAccessToken();

    const sheets = google.sheets({ version: 'v4', auth: accessToken });
    const spreadsheetId = '1TX7Y16n7DsPaTojMb_c3LVNp2Hgwtt4EvIrWJIHaWPA';
    const range = 'Sheet1!A1:C3';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const data = response.data.values;
    console.log(data);
})();

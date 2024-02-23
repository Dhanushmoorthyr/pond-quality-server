const express = require('express');
const app = express();
const cors = require('cors');
const { getAuthToken } = require('./gservice');
const { google } = require('googleapis');
require("dotenv").config()
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');

app.use(cors());
app.use(express.json());

const SHEET_ID = process.env.SHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
console.log("🚀 ~ SHEET_ID:", SHEET_ID)

const sheets = google.sheets({ version: 'v4' });

const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
);

const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});
console.log("🚀 ~ authorizeUrl:", authorizeUrl)

app.get('/', async (req, res) => {
    try {
        // const auth = await authenticate({
        //     // keyfilePath: path.join(__dirname, '../oauth2.keys.json'),
        //     keyfilePath: path.join('', "https://firebasestorage.googleapis.com/v0/b/printwear-design.appspot.com/o/products%2Fcredentials.json?alt=media&token=b6b2d54f-4e77-41fe-bc5b-26bac90cbeb2"),
        //     scopes: [
        //         // 'https://www.googleapis.com/auth/drive',
        //         // 'https://www.googleapis.com/auth/drive.file',
        //         'https://www.googleapis.com/auth/spreadsheets',
        //     ],
        // });
        // google.options({ auth });

        const code = req.query.code;
        console.log("🚀 ~ app.get ~ code:", code)
        client.getToken(code, (err, tokens) => {
            console.log("🚀 ~ client.getToken ~ tokens:", tokens)
            if (err) {
                console.error('Error getting oAuth tokens:');
                throw err;
            }
            client.credentials = tokens;
            res.send('Authentication successful! Please return to the console.');
            // listMajors(client);
        });
        const data = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A1:C1`,
        });
        console.log("🚀 ~ app.get ~ res:", data)
        
        res.status(200).send('Hello, world!');
    } catch (error) {
        console.log("🚀 ~ app.get ~ error:", error)
        res.status(500).send("ERRR");
    }
});

app.get('/test', (req, res) => {
    console.log("coming");
    res.status(200).json({ message: 'Hello, world!' });
});

app.post('/sensor-data', (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: 'Data received!' });
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

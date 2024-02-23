const express = require('express');
const app = express();
const cors = require('cors');
const { google } = require('googleapis');
require("dotenv").config()
var admin = require("firebase-admin");

var serviceAccount = require("./pond-quality-5325c66d5988.json");

app.use(cors());
app.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pond-quality-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

const SHEET_ID = process.env.SHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const sheets = google.sheets({ version: 'v4' });

app.get('/', async (req, res) => {
    res.status(200).send('Main');
});

app.get('/test', (req, res) => {
    console.log("coming");
    res.status(200).json({ message: 'Hello, world!' });
});

const sendDataToFirestore = async (DO, Temp, pH, Conduct) => {

    const timestamp = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });

    let datePart = timestamp.split(',')[0].replace(/\//g, '-');

    // Replace colons in the time with dashes
    let timePart = timestamp.split(',')[1].trim().replace(" ", "");

    // Combine the date and time parts with a double underscore
    let newFormat = `${datePart}__${timePart}`;

    const newFSdata = await db.doc(`sensor-data/${newFormat}`).create({
        DO, Temp, pH, Conduct
    });
}

var canSaveToFirestore = false;

const firestoreSaveInterval = setInterval(() => {
    // console.log("initial");
    if (!canSaveToFirestore) canSaveToFirestore = true;
}, 30 * 1000);

app.post('/sensor-data', async (req, res) => {
    const {DO, Temp, pH, Conduct} = (req.body);
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './pond-quality-5325c66d5988.json',
            scopes: SCOPES
        });
        const client = await auth.getClient();
        
        google.options({ auth: client });

        const timestamp = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
        
        const data = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A:E`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [
                    // [(new Date().toLocaleDateString()) + ' ' + (new Date().toLocaleTimeString()), DO, Temp, pH, Conduct]
                    [timestamp, DO, Temp, pH, Conduct]
                ]
            }
        });

        if (canSaveToFirestore) {
            // console.log("being sent");
            await sendDataToFirestore(DO, Temp, pH, Conduct);
            canSaveToFirestore = false;
        }

        console.log(`🚀 ${new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' })}:`, data.statusText)

        if (!data.status == 200) throw new Error("Error in Google Sheets update!") 
        res.status(200).json({ message: 'Data saved!' });

    } catch (error) {
        console.log("🚀 ~ app.post ~ error:", error)
        res.status(500).send("Unable to save data");
        clearInterval(firestoreSaveInterval);
    }
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

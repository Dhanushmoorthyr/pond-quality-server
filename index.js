const express = require('express');
const app = express();
const cors = require('cors');
const { google } = require('googleapis');
require("dotenv").config()
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PORT = process.env.PORT || 3000;

const serviceAccount = require('./pond-quality-5325c66d5988.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

app.use(cors());
app.use(express.json());

const SHEET_ID = process.env.SHEET_ID;
const COLLECTION = "dataStore";
const EMAIL = process.env.EMAIL;
const POND_ID = "pond1";
const SYSTEM_ID = "system1";
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const sheets = google.sheets({ version: 'v4' });

app.get('/', async (req, res) => {
    res.status(200).send('Main');
});

app.get('/test', (req, res) => {
    console.log("coming");
    res.status(200).json({ message: 'Hello, world!' });
});

function getTimestampString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, '0'); // Add leading zero for single-digit days
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

const sendDataToFirestore = async (DO, Temp, pH, Conduct) => {

    const timestamp = new Date();

    let newFormat = getTimestampString();
    try {
        await db.collection(COLLECTION).doc(EMAIL).collection(POND_ID).doc(SYSTEM_ID).set({
            [newFormat]: {
                "DO": DO,
                "TEMP": Temp,
                "PH": pH,
                "TDS": Conduct
            }
        }, { merge: true });

        await db.collection(COLLECTION).doc(EMAIL).set({
            "system1": {
                "DO": DO,
                "TEMP": Temp,
                "PH": pH,
                "TDS": Conduct
            }
        }, { merge: true });

        console.log("Data sent to Firestore");
    } catch (error) {
        console.log("Error in storing: ", error);
    }
}

var canSaveToFirestore = false;

const firestoreSaveInterval = setInterval(() => {
    // console.log("initial");
    if (!canSaveToFirestore) canSaveToFirestore = true;
}, 30 * 1000);

app.post('/sensor-data', async (req, res) => {
    const { DO, Temp, pH, Conduct } = (req.body);
    console.log(req.body);
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
        console.log(data.data);

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

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

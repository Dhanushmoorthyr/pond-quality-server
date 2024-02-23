const express = require('express');
const app = express();
const cors = require('cors');
const { google } = require('googleapis');
require("dotenv").config()

app.use(cors());
app.use(express.json());

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

app.post('/sensor-data', async (req, res) => {
    const {DO, Temp, pH, Conduct} = (req.body);
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './pond-quality-5325c66d5988.json',
            scopes: SCOPES
        });
        const client = await auth.getClient();
        
        google.options({ auth: client });
        
        const data = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A:E`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [
                    [(new Date().toLocaleDateString()) + ' ' + (new Date().toLocaleTimeString()), DO, Temp, pH, Conduct]
                ]
            }
        });

        console.log("🚀 ~ app.get ~ res:", data)
        if (!data.status == 200) throw new Error("Error in Google Sheets update!") 
        res.status(200).json({ message: 'Data saved!' });
    } catch (error) {
        console.log("🚀 ~ app.post ~ error:", error)
        res.status(500).send("Unable to save data");
    }
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

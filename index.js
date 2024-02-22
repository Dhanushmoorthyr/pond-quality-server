const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config()

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Hello, world!');
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

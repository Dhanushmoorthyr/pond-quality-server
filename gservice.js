const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function getAuthToken() {
    // const auth = google.auth.fromJSON(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const auth = await google.auth.getClient({
        scopes: SCOPES,
    });
    // const authToken = await auth.getClient();
    return auth;
}

module.exports = {
    getAuthToken,
}

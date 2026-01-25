const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser since we might not have dotenv installed/configured for scripts
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1]] = match[2];
        }
    });
    return env;
}

const env = loadEnv();
const apiKey = env['GOOGLE_TTS_GENERATIVE_LANGUAGE_API_KEY'] || env['GOOGLE_API_KEY'];

console.log("Using API Key (first 10 chars):", apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

if (!apiKey) {
    console.error("No API Key found!");
    process.exit(1);
}

const postData = JSON.stringify({
    input: { text: "Hello, this is a test." },
    voice: { languageCode: "en-US", name: "en-US-Chirp3-HD-Kore" },
    audioConfig: { audioEncoding: "MP3" }
});

const options = {
    hostname: 'texttospeech.googleapis.com',
    path: `/v1/text:synthesize?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("SUCCESS: TTS API returned 200 OK. Audio content received.");
        } else {
            console.error("ERROR: TTS API failed.");
            console.error(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

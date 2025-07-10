const https = require('https');

const testApiEndpoint = () => {
    console.log('Testing Vercel API endpoint...');
    
    const options = {
        hostname: 'freefiretournaments-d3h43ndw2-nishus-projects-70e433b8.vercel.app',
        path: '/api/tournament-notifications',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Node.js Test Script'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
    });

    req.setTimeout(30000, () => {
        console.log('Request timeout');
        req.destroy();
    });

    req.end();
};

testApiEndpoint();

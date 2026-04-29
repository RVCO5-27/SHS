const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testLogin() {
    const loginData = JSON.stringify({
        username: 'admin_main',
        password: '@D3pedSDO'
    });
    
    console.log('=== STEP 1: LOGIN REQUEST ===');
    const loginRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    }, loginData);
    
    console.log('Status Code:', loginRes.statusCode);
    console.log('Response Body:', loginRes.body);
    console.log('Set-Cookie Header:', loginRes.headers['set-cookie']);
    
    // Extract authToken from cookies
    let authToken = null;
    if (loginRes.headers['set-cookie']) {
        for (const cookie of loginRes.headers['set-cookie']) {
            if (cookie.startsWith('authToken=')) {
                authToken = cookie.split(';')[0];
                break;
            }
        }
    }
    
    console.log('Extracted authToken cookie:', authToken);
    
    if (loginRes.statusCode === 200 && authToken) {
        console.log('\n=== STEP 2: PROFILE REQUEST ===');
        const profileRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/profile',
            method: 'GET',
            headers: {
                'Cookie': authToken
            }
        });
        
        console.log('Status Code:', profileRes.statusCode);
        console.log('Response Body:', profileRes.body);
        
        if (profileRes.statusCode === 200) {
            console.log('\n=== RESULT ===');
            console.log('SUCCESS: Authentication flow works correctly!');
            const profile = JSON.parse(profileRes.body);
            console.log('User Profile:', profile);
        } else {
            console.log('\n=== RESULT ===');
            console.log('FAILURE: Profile request failed');
        }
    } else {
        console.log('\n=== RESULT ===');
        console.log('FAILURE: Login did not return authToken cookie');
    }
}

testLogin().catch(console.error);
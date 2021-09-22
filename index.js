require('dotenv').config()
const express = require('express');
const querystring = require('querystring');
const app = express();
const axios = require('axios');
const port = 8888;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
// app.METHOD(PATH, HANDLER)



app.get('/', (req, res) => {
    const data = {
        name: 'Hello',
        isAwesome: true
    };

    res.json(data);
});

const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text;
};
const stateKey = 'spotify_auth_state';

/////////////////////////////////////////////////////////
// Request Authorization from Spotify
/////////////////////////////////////////////////////////

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-private user-read-email'

    const queryParams = querystring.stringify({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scope
    });

    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

/////////////////////////////////////////////////////////
// Use Auth Code to request Auth Token
/////////////////////////////////////////////////////////

app.get('/callback', (req, res) => {
    const code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }),
        headers: {
            'content_type': 'application/x-www=form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
    })
        .then(response => {
            if (response.status === 200) {
                
                /////////////////////////////////////////////////////////
                // Use Access Token to request data from Spotify
                /////////////////////////////////////////////////////////

                const { access_token, token_type } = response.data;

                axios.get('https://api.spotify.com/v1/me', {
                    headers: {
                        Authorization: `${token_type} ${access_token}`
                    }
                })
                    .then(response => {
                        res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
                    })
                    .catch(error => {
                        res.send(error);
                    })

                ////////////////////////////////////////////////////////
                // Test Refresh Token
                ////////////////////////////////////////////////////////

                // const { refresh_token } = response.data;

                // axios.get(`http://localhost:8888/refresh_token?refresh_token=${refresh_token}`)
                //     .then(response => {
                //         res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
                //     })
                //     .catch(error => {
                //         res.send(error);
                //     });
                
            } else {
                res.send(response);
            }


        })
        .catch(error => {
            res.send(error);
        })
});

/////////////////////////////////////////////////////////
// Refresh our token if it expires
/////////////////////////////////////////////////////////

app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        }),
        headers: {
            'content_type': 'application/x-www=form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
    })
        .then(response => {
            res.send(response.data)
        })
        .catch(error => {
            res.send(error);
        })
});





app.listen(port, () => {
    console.log(`Express App listening at http://localhost:${port}`);
});
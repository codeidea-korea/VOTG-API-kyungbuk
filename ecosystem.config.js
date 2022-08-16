module.exports = {
    apps: [
        {
            name: 'ASH-API-dev',
            script: './app.js',
            instances: 1,
            time: true,
            autorestart: false,
            watch: true, //change restart
            // prettylist: true,
            TZ: 'Asia/Seoul',
            env: {
                NODE_ENV: 'development',
            },
        },
        {
            name: 'ASH-API-prod',
            script: './app.js',
            instances: 1,
            time: true,
            autorestart: false,
            watch: false,
            // prettylist: true,
            TZ: 'Asia/Seoul',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}

const http = require('http');

const app = require('./app');
const config = require('./config/env');

const server = http.createServer(app);

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use.`);
        process.exit(1);
    }

    throw err;
});

server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});

import server from './app';
const port = Number(process.env.PORT) || 6688;
server.listen(port);
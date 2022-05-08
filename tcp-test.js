import net from 'net';
import zpad from 'zpad';
import {generate as generateRandomString} from 'randomstring/lib/randomstring.js';
import lpstream from 'length-prefixed-stream';

const port = 8080;
const server = new net.Server({noDelay: true});

server.listen(port, () => {
    console.log('Listening!');
});

const dataLength = 25;
const sendInterval = 10;
const messageInterval = 2500;
let nonce = 0;

server.on('connection', socket => {
    console.log('Connection!');
    let pings = [];
    let sentPings = [];
    const connectionTime = (new Date()).getTime();

    const decode = lpstream.decode();
    const encode = lpstream.encode();
    encode.pipe(socket);

    decode.on('data', message => {
        const messageStr = message.toString();
        const now = new Date().getTime();
        sentPings = sentPings.filter(sent => {
            if(sent.data !== messageStr) return true;
            pings.push({from: sent.time, to: now, duration: (now - sent.time)});
            return false;
        });
    });

    const pingIntervalID = setInterval(() => {
        nonce++;
        const data = zpad(nonce, 10) + ':' + generateRandomString(dataLength - 11);
        sentPings.push({data, time: new Date().getTime()});
        encode.write(data);
    }, sendInterval);
    const messageIntervalID = setInterval(() => {
        const now = new Date().getTime();
        const recentPings = pings.filter(ping => ping.to > (now - messageInterval));
        const average = recentPings.reduce((p,c)=>p+c.duration, 0) / recentPings.length;
        console.log(`Average ping: ${average}ms`);
    }, messageInterval);

    socket.on('close', (hadError) => {
        clearInterval(pingIntervalID);
        clearInterval(messageIntervalID);
        console.log(`Connection closed! Had error: ${hadError}`);
        const now = (new Date()).getTime();
        console.log(`Lasted ${now - connectionTime} ms`);
    });

    socket.on('data', data => {
        decode.write(data);
    });
});

import { WebSocketServer } from 'ws';
import { generate as generateRandomString } from 'randomstring';
import zpad from 'zpad';

const wss = new WebSocketServer({
    port: 8080
});

const dataLength = 25;
const sendInterval = 50;
const messageInterval = 2500;
let nonce = 0;

wss.on('connection', ws => {
    console.log('Connection!');
    let pings = [];
    let sentPings = [];
    const connectionTime = (new Date()).getTime();

    const pingIntervalID = setInterval(() => {
        nonce++;
        const data = zpad(nonce, 10) + ':' + generateRandomString(dataLength - 11);
        sentPings.push({data, time: new Date().getTime()});
        ws.send(data);
    }, sendInterval);
    const messageIntervalID = setInterval(() => {
        const now = new Date().getTime();
        const recentPings = pings.filter(ping => ping.to > (now - messageInterval));
        const average = recentPings.reduce((p,c)=>p+c.duration, 0) / recentPings.length;
        console.log(`Average ping: ${average}ms`);
    }, messageInterval);

    ws.on('close', (code, reason) => {
        clearInterval(pingIntervalID);
        clearInterval(messageIntervalID);
        console.log('Connection closed!');
        const now = (new Date()).getTime();
        console.log(code);
        console.log(reason.toString());
        console.log(`Lasted ${now - connectionTime} ms`);
    });

    ws.on('message', message => {
        const messageStr = message.toString();
        const now = new Date().getTime();
        sentPings = sentPings.filter(sent => {
            if(sent.data !== messageStr) return true;
            pings.push({from: sent.time, to: now, duration: (now - sent.time)});
            return false;
        });
    });
});

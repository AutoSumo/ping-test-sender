import FasterSerialPort from 'faster-serialport';
import { generate as generateRandomString } from 'randomstring';
import zpad from 'zpad';

const port = new FasterSerialPort({ path: 'COM5', baudRate: 115200, autoOpen: true });

const dataLength = 15;
const sendInterval = 1000;
const messageInterval = 10000;
let nonce = 0;

port.on('error', function(err) {
    console.log('Error: ', err.message)
});

let pings = [];
let sentPings = [];

setInterval(() => {
    nonce++;
    const data = zpad(nonce, 10) + ':' + generateRandomString(dataLength - 11);
    sentPings.push({data, time: new Date().getTime()});
    console.log(`Sending ${data}`);
    port.write(data);
}, sendInterval);

setInterval(() => {
    const now = new Date().getTime();
    const recentPings = pings.filter(ping => ping.to > (now - messageInterval));
    //const recentPings = pings;
    const average = recentPings.reduce((p,c)=>p+c.duration, 0) / recentPings.length;
    console.log(`Average ping: ${average}ms`);
}, messageInterval);

port.on('data', message => {
    const messageStr = message.toString().trim();
    console.log(messageStr);
    const now = new Date().getTime();
    let found = false;
    sentPings = sentPings.filter(sent => {
        if(sent.data !== messageStr) return true;
        pings.push({from: sent.time, to: now, duration: (now - sent.time)});
        found = true;
        return false;
    });

    if(!found) {
        console.log(`Got extra data: ${messageStr}`);
    }
});

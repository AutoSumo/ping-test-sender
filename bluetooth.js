import { SerialPort } from 'serialport';
import { generate as generateRandomString } from 'randomstring';
import zpad from 'zpad';

const port = new SerialPort({ path: 'COM11', baudRate: 9600 });

const dataLength = 25;
const sendInterval = 2000;
const messageInterval = 10000;
let nonce = 0;

port.on('error', function(err) {
    console.log('Error: ', err.message)
});

let pings = [];
let sentPings = [];
const connectionTime = (new Date()).getTime();

setInterval(() => {
    nonce++;
    const data = zpad(nonce, 10) + ':' + generateRandomString(dataLength - 11);
    sentPings.push({data, time: new Date().getTime()});
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
    const messageStr = message.toString();
    const now = new Date().getTime();
    sentPings = sentPings.filter(sent => {
        if(sent.data !== messageStr) return true;
        pings.push({from: sent.time, to: now, duration: (now - sent.time)});
        return false;
    });
});

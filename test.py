import serial
import time


def current_milli_time():
    return round(time.time() * 1000)


ser = serial.Serial('COM5', 115200, timeout=0)
last_sent = current_milli_time() + 1000
nonce = 0
sent_time = 0

while True:
    now = current_milli_time()
    if now - last_sent > 1000:
        nonce += 1
        line = f'{nonce}-str\n'
        print(f'Sending {line.strip()}')
        ser.write(line.encode())
        sent_time = now
        last_sent = now

    data = ser.read(256)
    if len(data) > 0:
        print(f'Got {data.decode().strip()} (+{now-last_sent}ms)')

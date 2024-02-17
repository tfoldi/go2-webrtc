# Copyright (c) 2024, RoboVerse community
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import asyncio
import os
import paho.mqtt.client as mqtt
import logging
import json

from go2_webrtc import Go2Connection


logging.basicConfig(level=logging.WARN)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

mqtt_client = None


def on_connect(client, userdata, flags, reason_code, properties):
    pass


def on_publish(client, userdata, mid, reason_codes, properties):
    pass


def get_mqtt_client():
    global mqtt_client

    mqtt_broker = os.getenv("MQTT_BROKER")
    mqtt_username = os.getenv("MQTT_USERNAME")
    mqtt_password = os.getenv("MQTT_PASSWORD")
    mqtt_port = os.getenv("MQTT_PORT") or 1883

    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2, client_id="Go2", protocol=mqtt.MQTTv311
    )
    mqtt_client.on_connect = on_connect
    mqtt_client.on_publish = on_publish

    mqtt_client.username_pw_set(username=mqtt_username, password=mqtt_password)

    mqtt_client.connect(host=mqtt_broker, port=mqtt_port, keepalive=120)

    # start the MQTT processing loop
    mqtt_client.loop_start()


# Connect to the robot and disconnect after 3 seconds
async def bridge_mqtt(conn):
    await conn.connectRobot()
    get_mqtt_client()

    # conn.data_channel.send('{"type": "unsubscribe", "topic": "rt/lf/lowstate" }')
    # conn.data_channel.send('{"type": "unsubscribe", "topic": "rt/multiplestate" }')

    while True:
        await asyncio.sleep(1)


def on_data_channel_open():
    pass


def on_data_channel_message(message):
    global mqtt_client
    print("GO2->MQTT Received message: " + message)

    msgobj = json.loads(message)
    if msgobj.get("type") == "validation" and msgobj.get("data") == "Validation Ok.":
        conn.data_channel.send('{"type": "subscribe", "topic": "rt/lf/lowstate" }')
        conn.data_channel.send('{"type": "subscribe", "topic": "rt/multiplestate" }')
        conn.data_channel.send('{"type": "subscribe", "topic": "rt/utlidar/switch" }')
        conn.data_channel.send(
            '{"type": "subscribe", "topic": "rt/utlidar/voxel_map" }'
        )
        conn.data_channel.send(
            '{"type": "subscribe", "topic": "rt/utlidar/lidar_state" }'
        )
        conn.data_channel.send('{"type": "subscribe", "topic": "rt/robot_pose" }')

    if mqtt_client:
        topic = msgobj.get("topic") or "go2/system"
        mqtt_client.publish(topic, message, qos=1)
    else:
        logger.warn("MQTT client not initialized")


# Example usage
if __name__ == "__main__":
    conn = Go2Connection(os.getenv("GO2_IP"), os.getenv("GO2_TOKEN"))

    conn.data_channel.on("open", on_data_channel_open)
    conn.data_channel.on("message", on_data_channel_message)

    coro = bridge_mqtt(conn)

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(coro)
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(conn.pc.close())

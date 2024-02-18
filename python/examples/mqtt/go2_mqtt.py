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

from go2_webrtc import Go2Connection, RTC_TOPIC


logging.basicConfig(level=logging.WARN)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class Go2MQTTBridge:
    def __init__(self):
        self.mqtt_client = None
        self.initialize_mqtt_client()

    def initialize_mqtt_client(self):
        mqtt_broker = os.getenv("MQTT_BROKER")
        mqtt_username = os.getenv("MQTT_USERNAME")
        mqtt_password = os.getenv("MQTT_PASSWORD")
        mqtt_port = int(os.getenv("MQTT_PORT", 1883))

        self.mqtt_client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2, client_id="Go2", protocol=mqtt.MQTTv311
        )

        self.mqtt_client.username_pw_set(username=mqtt_username, password=mqtt_password)
        self.mqtt_client.connect(host=mqtt_broker, port=mqtt_port, keepalive=120)
        self.mqtt_client.loop_start()

    async def bridge_mqtt(self, conn):
        await conn.connectRobot()

        while True:
            await asyncio.sleep(1)

    def on_validated(self):
        for topic in RTC_TOPIC.values():
            conn.data_channel.send(json.dumps({"type": "subscribe", "topic": topic}))

    def on_data_channel_message(self, message):
        if isinstance(message, str):
            logger.debug("GO2->MQTT Received message: %s", message)

        topic = "rt/unknown"

        if self.mqtt_client:
            try:
                if isinstance(message, str):
                    msgobj = json.loads(message)
                    topic = msgobj.get("topic", "rt/system")
                elif isinstance(message, bytes):
                    topic = "rt/utlidar/voxel_map_compressed"
            finally:
                self.mqtt_client.publish(topic, message, qos=1)
        else:
            logger.warn("MQTT client not initialized")


# TODO: parse command line arguments
if __name__ == "__main__":
    # connect to MQTT broker
    mqtt_bridge = Go2MQTTBridge()

    # set up connection to Go2
    conn = Go2Connection(
        os.getenv("GO2_IP"),
        os.getenv("GO2_TOKEN"),
        on_validated=mqtt_bridge.on_validated,
    )

    conn.data_channel.on("open", lambda: logger.debug("Data channel open"))
    conn.data_channel.on("message", mqtt_bridge.on_data_channel_message)

    # connect to Go2
    coro = mqtt_bridge.bridge_mqtt(conn)

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(coro)
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(conn.pc.close())

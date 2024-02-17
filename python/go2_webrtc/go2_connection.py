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
from aiortc import (
    RTCPeerConnection,
    RTCSessionDescription,
    AudioStreamTrack,
    VideoStreamTrack,
)
from aiortc.contrib.media import MediaBlackhole, MediaRecorder
import aiohttp
# from go2_webrtc.go2_cv_video import Go2CvVideo
from go2_webrtc.constants import SPORT_CMD, DATA_CHANNEL_TYPE
import logging
from dotenv import load_dotenv
import os
import json
import hashlib
import base64


load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class Go2AudioTrack(AudioStreamTrack):
    kind = "audio"


class Go2VideoTrack(VideoStreamTrack):
    kind = "video"


class Go2Connection:
    def __init__(self, ip=None, token=None):
        self.pc = RTCPeerConnection()
        self.ip = ip
        self.token = token
        self.validation_result = "PENDING"

        # self.audio_track = Go2AudioTrack()
        # self.video_track = Go2VideoTrack()
        # self.video_track = Go2CvVideo()
        self.audio_track = MediaBlackhole()
        self.video_track = MediaBlackhole()

        # Create and add a data channel
        self.data_channel = self.pc.createDataChannel("data")
        self.data_channel.on("open", self.on_data_channel_open)
        self.data_channel.on("message", self.on_data_channel_message)

        # self.pc.addTransceiver("video", direction="recvonly")
        # self.pc.addTransceiver("audio", direction="sendrecv")
        # self.pc.addTrack(AudioStreamTrack())

        self.pc.on("track", self.on_track)
        self.pc.on("connectionstatechange", self.on_connection_state_change)




    def on_connection_state_change(self):
        logger.info("Connection state is %s", self.pc.connectionState)

    def on_track(self, track):
        logger.debug("Receiving %s", track.kind)
        if track.kind == "audio":
            pass
            # self.audio_track.addTrack(track)
        elif track.kind == "video":
            # self.video_track.addTrack(track)
            pass

    async def generate_offer(self):
        logger.debug("Generating offer")
        await self.audio_track.start()
        await self.video_track.start()

        offer = await self.pc.createOffer()
        logger.debug(offer.sdp)

        async def send_pings():
            while True:
                logger.info("in Sending ping")
                await asyncio.sleep(5)

        @self.data_channel.on("open")
        def on_open():
            asyncio.ensure_future(send_pings())


        await self.pc.setLocalDescription(offer)
        return offer.sdp

    # async def connect(self):
    #     logger.info("Connected to the robot")

    async def set_answer(self, sdp):
        """Set the remote description with the provided answer."""
        answer = RTCSessionDescription(sdp, type="answer")
        await self.pc.setRemoteDescription(answer)

    def on_data_channel_open(self):
        logger.info("Data channel is open")

    def on_data_channel_message(self, message):
        logger.info("Received message: %s", message)
        message = json.loads(message)
        if message.get("type") == "validation":
            self.validate(message)

    def validate(self, message):
        if message.get("data") == "Validation Ok.":
            self.validation_result = "SUCCESS"
        else:
            logger.info("Sending validation message %s", message.get("data"))
            self.publish(
                "",
                self.encrypt_key(message.get("data")),
                DATA_CHANNEL_TYPE["VALIDATION"],
            )

    def publish(self, topic, data, msg_type):
        if not self.data_channel or not self.data_channel.readyState == "open":
            logger.error(
                "Data channel is not open. State is %s", self.data_channel.readyState
            )
            return
        payload = {
            "type": msg_type or DATA_CHANNEL_TYPE["MESSAGE"],
            "topic": topic,
            "data": data,
        }
        logger.info("Sending payload %s", json.dumps(payload))
        self.data_channel.send(json.dumps(payload))
        logger.info("Payload sent")

    async def connectRobot(self):
        """Post the offer to an HTTP server and set the received answer."""
        offer_sdp = await self.generate_offer()
        async with aiohttp.ClientSession() as session:
            url = f"http://{self.ip}:8081/offer"
            headers = {"content-type": "application/json"}
            data = {
                "sdp": offer_sdp,
                "id": "STA_localNetwork",
                "type": "offer",
                "token": self.token,
            }
            logger.info("Sending offer to the signaling server at %s", url)
            # logger.debug(data)

            async with session.post(url, json=data, headers=headers) as resp:
                if resp.status == 200:
                    answer_data = await resp.json()
                    logger.info("Received answer from server")
                    logger.debug(answer_data["sdp"])
                    answer_sdp = answer_data.get("sdp")
                    await self.set_answer(answer_sdp)
                    # await self.connect()
                else:
                    logger.info("Failed to get answer from server")
        while True:
            await asyncio.sleep(1)

    @staticmethod
    def hex_to_base64(hex_str):
        # Convert hex string to bytes
        bytes_array = bytes.fromhex(hex_str)
        # Encode the bytes to Base64 and return as a string
        return base64.b64encode(bytes_array).decode("utf-8")

    @staticmethod
    def encrypt_key(key):
        # Append the prefix to the key
        prefixed_key = f"UnitreeGo2_{key}"
        # Encrypt the key using MD5 and convert to hex string
        encrypted = Go2Connection.encrypt_by_md5(prefixed_key)
        # Convert the hex string to Base64
        return Go2Connection.hex_to_base64(encrypted)

    @staticmethod
    def encrypt_by_md5(input_str):
        # Create an MD5 hash object
        hash_obj = hashlib.md5()
        # Update the hash object with the bytes of the input string
        hash_obj.update(input_str.encode("utf-8"))
        # Return the hex digest of the hash
        return hash_obj.hexdigest()


# Example usage
if __name__ == "__main__":
    conn = Go2Connection(os.getenv("GO2_IP"), os.getenv("GO2_TOKEN"))
    robot = conn.connectRobot()

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(robot)
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(conn.pc.close())

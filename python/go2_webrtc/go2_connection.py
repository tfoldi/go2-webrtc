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
import aiohttp
import logging
from dotenv import load_dotenv
import os


load_dotenv()

logging.basicConfig(level=logging.WARN)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class Go2AudioTrack(AudioStreamTrack):
    kind = "audio"


class Go2VideoTrack(VideoStreamTrack):
    kind = "video"


class Go2Connection:
    def __init__(self, ip=None, token=None):
        self.pc = RTCPeerConnection()

        self.audio_track = Go2AudioTrack()
        self.video_track = Go2VideoTrack()

        # Create and add a data channel
        self.data_channel = self.pc.createDataChannel("data")
        self.data_channel.on("open", self.on_data_channel_open)
        self.data_channel.on("message", self.on_data_channel_message)

        self.ip = ip
        self.token = token

    async def generate_offer(self):
        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)
        return offer.sdp

    async def connect(self):
        logger.info("Connected to the robot")
        while True:
            await asyncio.sleep(1)

    async def set_answer(self, sdp):
        """Set the remote description with the provided answer."""
        answer = RTCSessionDescription(sdp, type="answer")
        await self.pc.setRemoteDescription(answer)

    def on_data_channel_open(self):
        logger.info("Data channel is open")

    def on_data_channel_message(self, message):
        logger.info("Received message: %s", message)

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
                    logger.debug(answer_data)
                    answer_sdp = answer_data.get("sdp")
                    await self.set_answer(answer_sdp)
                    await self.connect()
                else:
                    logger.info("Failed to get answer from server")


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
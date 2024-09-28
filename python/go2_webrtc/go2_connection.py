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
import datetime
import random
import binascii
import uuid
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES
from Crypto.Cipher import PKCS1_v1_5
import requests


# from go2_webrtc.go2_cv_video import Go2CvVideo
from go2_webrtc.constants import SPORT_CMD, DATA_CHANNEL_TYPE
import logging
from dotenv import load_dotenv
import os
import json
import hashlib
import struct
import base64

from go2_webrtc.lidar_decoder import LidarDecoder


load_dotenv()


logging.basicConfig(level=logging.WARN)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


decoder = LidarDecoder()


class Go2AudioTrack(AudioStreamTrack):
    kind = "audio"


class Go2VideoTrack(VideoStreamTrack):
    kind = "video"


class Go2Connection:
    def __init__(
        self, ip=None, token="", on_validated=None, on_message=None, on_open=None
    ):
        self.pc = RTCPeerConnection()
        self.ip = ip
        self.token = token
        self.validation_result = "PENDING"
        self.on_validated = on_validated
        self.on_message = on_message
        self.on_open = on_open

        # self.audio_track = Go2AudioTrack()
        # self.video_track = Go2VideoTrack()
        # self.video_track = Go2CvVideo()
        self.audio_track = MediaBlackhole()
        self.video_track = MediaBlackhole()

        # Create and add a data channel
        self.data_channel = self.pc.createDataChannel("data", id=2, negotiated=False)
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

        await self.pc.setLocalDescription(offer)
        return offer.sdp

    async def connect(self):
        logger.info("Connected to the robot")

    async def set_answer(self, sdp):
        """Set the remote description with the provided answer."""
        answer = RTCSessionDescription(sdp, type="answer")
        await self.pc.setRemoteDescription(answer)

    def on_data_channel_open(self):
        logger.debug("Data channel is open")
        if self.on_open:
            self.on_open()

    def on_data_channel_message(self, message):
        logger.debug("Received message: %s", message)

        # If the data channel is not open, open it
        # it should not be closed if got a message
        if self.data_channel.readyState != "open":
            self.data_channel._setReadyState("open")

        try:
            if isinstance(message, str):
                msgobj = json.loads(message)
                if msgobj.get("type") == "validation":
                    self.validate(msgobj)
            elif isinstance(message, bytes):
                msgobj = Go2Connection.deal_array_buffer(message)

            if self.on_message:
                self.on_message(message, msgobj)

        except json.JSONDecodeError:
            pass

    def validate(self, message):
        if message.get("data") == "Validation Ok.":
            self.validation_result = "SUCCESS"
            if self.on_validated:
                self.on_validated()
        else:
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
        logger.debug("-> Sending message %s", json.dumps(payload))
        self.data_channel.send(json.dumps(payload))

    async def connect_robot_v10(self):
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
            logger.debug("Sending offer to the signaling server at %s", url)

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

    async def connect_robot(self):
        try:
            return await self.connect_robot_v10()
        except Exception as e:
            logger.info(
                "Failed to connect to the robot with firmware 1.0.x method, trying new method... %s",
                e,
            )

        logging.info("Trying to send SDP using a NEW method...")

        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)

        sdp_offer = self.pc.localDescription

        peer_answer = Go2Connection.get_peer_answer(sdp_offer, self.token, self.ip)
        answer = RTCSessionDescription(sdp=peer_answer["sdp"], type=peer_answer["type"])
        await self.pc.setRemoteDescription(answer)

    @staticmethod
    def get_peer_answer(sdp_offer, token, robot_ip):
        sdp_offer_json = {
            "id": "STA_localNetwork",
            "sdp": sdp_offer.sdp,
            "type": sdp_offer.type,
            "token": token,
        }

        new_sdp = json.dumps(sdp_offer_json)
        url = f"http://{robot_ip}:9991/con_notify"
        response = Go2Connection.make_local_request(url, body=None, headers=None)

        if response:
            # Decode the response text from base64
            decoded_response = base64.b64decode(response.text).decode("utf-8")

            # Parse the decoded response as JSON
            decoded_json = json.loads(decoded_response)

            # Extract the 'data1' field from the JSON
            data1 = decoded_json.get("data1")

            # Extract the public key from 'data1'
            public_key_pem = data1[10 : len(data1) - 10]
            path_ending = Go2Connection.calc_local_path_ending(data1)

            # Generate AES key
            aes_key = Go2Connection.generate_aes_key()

            # Load Public Key
            public_key = Go2Connection.rsa_load_public_key(public_key_pem)

            # Encrypt the SDP and AES key
            body = {
                "data1": Go2Connection.aes_encrypt(new_sdp, aes_key),
                "data2": Go2Connection.rsa_encrypt(aes_key, public_key),
            }

            # URL for the second request
            url = f"http://{robot_ip}:9991/con_ing_{path_ending}"

            # Set the appropriate headers for URL-encoded form data
            headers = {"Content-Type": "application/x-www-form-urlencoded"}

            # Send the encrypted data via POST
            response = Go2Connection.make_local_request(
                url, body=json.dumps(body), headers=headers
            )

            # If response is successful, decrypt it
            if response:
                decrypted_response = Go2Connection.aes_decrypt(response.text, aes_key)
                peer_answer = json.loads(decrypted_response)

                return peer_answer
            else:
                raise ValueError(f"Failed to get answer from server")

        else:
            raise ValueError(
                "Failed to receive initial public key response with new method."
            )

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

    @staticmethod
    def generate_id():
        return int(
            datetime.datetime.now().timestamp() * 1000 % 2147483648
        ) + random.randint(0, 999)

    @staticmethod
    def deal_array_buffer(n):
        # Unpack the first 2 bytes as an unsigned short (16-bit) to get the length
        length = struct.unpack("H", n[:2])[0]

        # Extract the JSON segment and the remaining data
        json_segment = n[4 : 4 + length]
        remaining_data = n[4 + length :]

        # Decode the JSON segment from UTF-8 and parse it
        json_str = json_segment.decode("utf-8")
        obj = json.loads(json_str)

        decoded_data = decoder.decode(remaining_data, obj["data"])

        # Attach the remaining data to the object
        obj["data"]["data"] = decoded_data

        return obj

    @staticmethod
    def calc_local_path_ending(data1):
        # Initialize an array of strings
        strArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

        # Extract the last 10 characters of data1
        last_10_chars = data1[-10:]

        # Split the last 10 characters into chunks of size 2
        chunked = [last_10_chars[i : i + 2] for i in range(0, len(last_10_chars), 2)]

        # Initialize an empty list to store indices
        arrayList = []

        # Iterate over the chunks and find the index of the second character in strArr
        for chunk in chunked:
            if len(chunk) > 1:
                second_char = chunk[1]
                try:
                    index = strArr.index(second_char)
                    arrayList.append(index)
                except ValueError:
                    # Handle case where the character is not found in strArr
                    print(f"Character {second_char} not found in strArr.")

        # Convert arrayList to a string without separators
        joinToString = "".join(map(str, arrayList))

        return joinToString

    @staticmethod
    def generate_aes_key() -> str:
        uuid_32 = uuid.uuid4().bytes
        uuid_32_hex_string = binascii.hexlify(uuid_32).decode("utf-8")
        return uuid_32_hex_string

    @staticmethod
    def rsa_load_public_key(pem_data: str) -> RSA.RsaKey:
        """Load an RSA public key from a PEM-formatted string."""
        key_bytes = base64.b64decode(pem_data)
        return RSA.import_key(key_bytes)

    @staticmethod
    def pad(data: str) -> bytes:
        """Pad data to be a multiple of 16 bytes (AES block size)."""
        block_size = AES.block_size
        padding = block_size - len(data) % block_size
        padded_data = data + chr(padding) * padding
        return padded_data.encode("utf-8")

    @staticmethod
    def aes_encrypt(data: str, key: str) -> str:
        """Encrypt the given data using AES (ECB mode with PKCS5 padding)."""
        # Ensure key is 32 bytes for AES-256
        key_bytes = key.encode("utf-8")
        # Pad the data to ensure it is a multiple of block size
        padded_data = Go2Connection.pad(data)
        # Create AES cipher in ECB mode
        cipher = AES.new(key_bytes, AES.MODE_ECB)
        encrypted_data = cipher.encrypt(padded_data)
        encoded_encrypted_data = base64.b64encode(encrypted_data).decode("utf-8")
        return encoded_encrypted_data

    @staticmethod
    def rsa_encrypt(data: str, public_key: RSA.RsaKey) -> str:
        """Encrypt data using RSA and a given public key."""
        cipher = PKCS1_v1_5.new(public_key)
        # Maximum chunk size for encryption with RSA/ECB/PKCS1Padding is key size - 11 bytes
        max_chunk_size = public_key.size_in_bytes() - 11
        data_bytes = data.encode("utf-8")
        encrypted_bytes = bytearray()
        for i in range(0, len(data_bytes), max_chunk_size):
            chunk = data_bytes[i : i + max_chunk_size]
            encrypted_chunk = cipher.encrypt(chunk)
            encrypted_bytes.extend(encrypted_chunk)
        # Base64 encode the final encrypted data
        encoded_encrypted_data = base64.b64encode(encrypted_bytes).decode("utf-8")
        return encoded_encrypted_data

    @staticmethod
    def unpad(data: bytes) -> str:
        """Remove padding from data."""
        padding = data[-1]
        return data[:-padding].decode("utf-8")

    @staticmethod
    def aes_decrypt(encrypted_data: str, key: str) -> str:
        """Decrypt the given data using AES (ECB mode with PKCS5 padding)."""
        # Ensure key is 32 bytes for AES-256
        key_bytes = key.encode("utf-8")
        # Decode Base64 encrypted data
        encrypted_data_bytes = base64.b64decode(encrypted_data)
        # Create AES cipher in ECB mode
        cipher = AES.new(key_bytes, AES.MODE_ECB)
        # Decrypt data
        decrypted_padded_data = cipher.decrypt(encrypted_data_bytes)
        # Unpad the decrypted data
        decrypted_data = Go2Connection.unpad(decrypted_padded_data)
        return decrypted_data

    @staticmethod
    def make_local_request(path, body=None, headers=None):
        try:
            # Send POST request with provided path, body, and headers
            response = requests.post(url=path, data=body, headers=headers)
            # Check if the request was successful (status code 200)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx, 5xx)
            if response.status_code == 200:
                return response  # Returning the whole response object if needed
            else:
                # Handle non-200 responses
                return None
        except requests.exceptions.RequestException as e:
            # Handle any exception related to the request (e.g., connection errors, timeouts)
            logging.error(f"An error occurred: {e}")
            return None


# Example usage
if __name__ == "__main__":
    conn = Go2Connection(os.getenv("GO2_IP"), os.getenv("GO2_TOKEN"))

    # Connect to the robot and disconnect after 3 seconds
    async def connect_then_disconnect(conn):
        await conn.connect_robot()
        for _ in range(3):
            await asyncio.sleep(1)

    task = connect_then_disconnect(conn)

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(task)
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(conn.pc.close())

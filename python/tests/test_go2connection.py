import pytest
import asyncio
from go2_webrtc import (
    Go2Connection,
)  # Adjust the import according to your project structure


@pytest.mark.asyncio
async def test_generate_offer():
    conn = Go2Connection()
    offer = await conn.generate_offer()
    assert (
        isinstance(offer, str) and len(offer) > 0
    ), "Offer should be a non-empty string"


@pytest.mark.asyncio
async def test_set_answer():
    conn = Go2Connection()
    offer = await conn.generate_offer()
    # Assuming we have a valid SDP answer string (this is just a placeholder)
    answer = "v=0\no=- 4612925294212871715 2 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0\na=msid-semantic: WMS\nm=application 9 DTLS/SCTP 5000\nc=IN IP4 0.0.0.0\na=mid:0\na=sctpmap:5000 webrtc-datachannel 1024"
    await conn.set_answer(answer)
    # Since set_answer doesn't return a value, we're just checking if it runs without raising an exception
    assert True, "set_answer should complete without error"

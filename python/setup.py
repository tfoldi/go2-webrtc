from setuptools import setup, find_packages

setup(
    name='go2-webrtc',
    version='0.1.0',
    packages=find_packages(),
    install_requires=[
        'aiortc',
        'aiohttp'
    ],
)


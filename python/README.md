# Unitree Go2 Python API (WebRTC)

The Unitree Go2 Python API provides a comprehensive interface for interacting with Unitree Go2 robots, facilitating control over WebRTC connections, video streaming, and MQTT bridgin. 
This API is designed to simplify the development of applications that communicate with Unitree Go2 robots, enabling developers to focus on creating innovative solutions. 

The API works with Air, Pro and Edu models.

## Features
* WebRTC Connection: Establish and manage WebRTC connections for real-time communication with the robot.
* (WIP) Video Streaming: Capture and stream video data from the robot's cameras.
* MQTT Messaging: Send and receive messages using MQTT for command and control.

## Installation
To install the Unitree Go2 Python API, ensure you have Python 3.6 or later. You can install the package using pip:

```bash
pip install git+https://github.com/tfoldi/go2-webrtc.git#subdirectory=python
```

## Usage

### Establishing a WebRTC Connection

```python
from go2_webrtc import Go2Connection

# Initialize the connection
conn = Go2Connection(robot_ip="192.168.1.1", token="your_token_here")

# Connect to the robot
await conn.connect()
```

### Examples 

Find detailed examples in the examples directory. Current examples

 * MQTT bridge between Go2 and an external MQTT Server
 * Joystick support (like xbox controller) via pygame


## Contributing
Contributions to the Unitree Go2 Python API are welcome! Send a PR.

## License
This project is licensed under the BSD 3-Clause License - see the LICENSE file for details.


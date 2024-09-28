# go2-webrtc - WebRTC API or Unitree GO2 Robots

The `go2-webrtc` project provides a WebRTC API for Unitree GO2 Robots, enabling real-time communication and control over these robots through a web interface. This project simplifies the process of connecting to and controlling Unitree GO2 Robots by leveraging the WebRTC protocol for efficient, low-latency communication.

Go2's WebRTC API supports all models, including Go2 Air, Pro, and Edu versions.

This branch does not work with firmwares prior to 1.1.1. If you have an older firmware, use the previous commit from the repository.

## Features

- **WebRTC Integration**: Utilizes WebRTC to establish a real-time communication channel between the web client and the robot.
- **User Interface**: Includes a simple web interface for connecting to the robot, sending commands, and viewing the robot's video stream.
- **Command Execution**: Allows users to execute predefined commands on the robot, such as movement and action commands.
- **Persistent Settings**: Saves connection settings (token and robot IP) in the browser's localStorage for easier reconnection.

## Getting Started

To get started with `go2-webrtc`, clone this repository and serve the `index.html` file from the backend server (`server.py`) to a modern web browser. Ensure that your Unitree GO2 Robot is powered on and connected to the same network as your computer.

```
git clone https://github.com/tfoldi/go2-webrtc
cd go2-webrtc
pip install -r python/requirements.txt
cd javascript
python ./server.py
```

### Prerequisites

- A Unitree GO2 Robot accessible over the local network. All models supported.
- A web browser that supports WebRTC (e.g., Chrome, Firefox).

### Usage

1. Enter your security token and robot IP address in the web interface.
2. Click the "Connect" button to establish a connection to the robot.
3. Use the command input to send commands to the robot.
4. The video stream from the robot (if available) will be displayed in the web interface.

### Obtaining security token

Connecting to your device without a security token is possible and might allow a connection to be established. However, this method limits you to a single active connection at any time. To simultaneously use multiple clients, such as a WebRTC-based application and a phone app, a valid security token is necessary. This ensures secure, multi-client access to your device.

The easiest way is to sniff the traffic between the dog and your phone. Assuming that you have Linux or Mac:

1. Run `tinyproxy` or any other HTTP proxy on your computer
2. Set your computer's IP and port as HTTP proxy on your phone
3. Run wireshark or `ngrep` on your box sniffing port 8081 `like ngrep port 8081`.
4. Look for the token in the TCP stream after you connect your phone to the dog via the app

The token looks like this in the request payload:

```
{
    "token": "eyJ0eXAiOizI1NiJtlbiI[..]CI6MTcwODAxMzUwOX0.hiWOd9tNCIPzOOLNA",
    "sdp": "v=0\r\no=- ",
    "id": "STA_localNetwork",
    "type": "offer"
}
```
## Development

This project is structured around several key JavaScript files:

- `index.js`: Main script for handling UI interactions and storing settings.
- `go2webrtc.js`: Core WebRTC functionality for connecting to and communicating with the robot. Can be used standalone as an API wrapper.
- `utils.js`: Utility functions, including encryption helpers.
- `constants.js`: Defines constants and command codes for robot control.
- `server.py`: Python server used for CORS proxying

To contribute or modify the project, refer to these files for implementing additional features or improving the existing codebase. PRs are welcome.

## License

This project is licensed under the BSD 2-clause License - see the [LICENSE](https://github.com/tfoldi/go2-webrtc/blob/master/LICENSE) file for details.

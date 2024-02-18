# go2-webrtc - WebRTC API or Unitree GO2 Robots

The `go2-webrtc` project provides a WebRTC API for Unitree GO2 Robots, enabling real-time communication and control over these robots through a web interface. This project simplifies the process of connecting to and controlling Unitree GO2 Robots by leveraging the WebRTC protocol for efficient, low-latency communication.

Go2's WebRTC API supports all models, including Go2 Air, Pro, and Edu versions.

## Features

- **WebRTC Integration**: Utilizes WebRTC to establish a real-time communication channel between the web client and the robot.
- **User Interface**: Includes a simple web interface for connecting to the robot, sending commands, and viewing the robot's video stream.
- **Command Execution**: Allows users to execute predefined commands on the robot, such as movement and action commands.
- **Persistent Settings**: Saves connection settings (token and robot IP) in the browser's localStorage for easier reconnection.

## Getting Started

To get started with `go2-webrtc`, clone this repository and serve the `index.html` file from a local web server to a modern web browser. Ensure that your Unitree GO2 Robot is powered on and connected to the same network as your computer.

```
git clone https://github.com/tfoldi/go2-webrtc
cd go2-webrtc
python3 -m http.server
```

## Sample Frontend Application
The [javascript](https://github.com/tfoldi/go2-webrtc/tree/master/javascript) folder contains a sample frontend application that demonstrates how to use the JS WebRTC API to connect to and control the Unitree GO2 Robots. Explore the [javascript](https://github.com/tfoldi/go2-webrtc/tree/master/javascript) folder for more details and examples.

## Python API for Backend/Console Applications
For backend or console applications, the [python](https://github.com/tfoldi/go2-webrtc/tree/master/python) folder provides a Python API that interfaces with the Unitree GO2 Robots. This API is ideal for developers looking to integrate robot control into their Python applications or scripts. Check out the [python](https://github.com/tfoldi/go2-webrtc/tree/master/python) folder for documentation and examples.

### Prerequisites

- A Unitree GO2 Robot accessible over the local network. All models supported including Air, Pro and Edu
- Local network connection (`STA-L`) to the robot

### Obtaining security token

One way is to sniff the traffic between the dog and your phone. Assuming that you have Linux or Mac:

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

Another option is to obtain token via the `/login/email` endpoint.

```
curl -vX POST https://global-robot-api.unitree.com/login/email -d "email=<EMAIL>&password=<MD5 hash of your password>"
```

## Development

This project is structured around several key JavaScript files for the frontend and a Python package for backend or console applications. To contribute or modify the project, refer to these resources for implementing additional features or improving the existing codebase. PRs are welcome.


## License

This project is licensed under the BSD 2-clause License - see the [LICENSE](https://github.com/tfoldi/go2-webrtc/blob/master/LICENSE) file for details.

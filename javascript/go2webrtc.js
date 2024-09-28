import { encryptKey } from "./utils.js";
import { SPORT_CMD, DataChannelType } from "./constants.js";

// Function to log messages to the console and the log window
// TODO: need better way to handle logging - maybe use a logger
function logMessage(text) {
  globalThis.logMessage ? globalThis.logMessage(text) : 0;
}

export class Go2WebRTC {
  constructor(token, robotIP, messageCallback) {
    this.token = token;
    this.robotIP = robotIP;
    this.messageCallback = messageCallback;

    this.msgCallbacks = new Map();
    this.validationResult = "PENDING";
    this.pc = new RTCPeerConnection({ sdpSemantics: "unified-plan" });
    this.channel = this.pc.createDataChannel("data");

    this.pc.addTransceiver("video", { direction: "recvonly" });
    this.pc.addTransceiver("audio", { direction: "sendrecv" });
    this.pc.addEventListener("track", this.trackEventHandler.bind(this));
    this.channel.onmessage = this.messageEventHandler.bind(this);

    this.heartbeatTimer = null;
  }

  trackEventHandler(event) {
    if (event.track.kind === "video") {
      this.VidTrackEvent = event;
    } else {
      this.AudTrackEvent = event;
    }
  }

  messageEventHandler(event) {
    if (
      event.data &&
      event.data.includes &&
      !event.data.includes("heartbeat")
    ) {
      console.log("onmessage", event);
      this.handleDataChannelMessage(event);
    }
  }

  handleDataChannelMessage(event) {
    const data =
      typeof event.data == "string"
        ? JSON.parse(event.data)
        : this.dealArrayBuffer(event.data);
    if (data.type === DataChannelType.VALIDATION) {
      this.rtcValidation(data);
    }

    if (this.messageCallback) {
      this.messageCallback(data);
    }
  }

  dealArrayBuffer(n) {
    const o = new Uint16Array(n.slice(0, 2)),
      s = n.slice(4, 4 + o[0]),
      c = n.slice(4 + o[0]),
      u = new TextDecoder("utf-8"),
      l = JSON.parse(u.decode(s));
    return (l.data.data = c), l;
  }

  initSDP() {
    this.pc
      .createOffer()
      .then((offer) => this.pc.setLocalDescription(offer))
      .then(() => {
        console.log("Offer created");
        logMessage("Offer created");
        console.log(this.pc.localDescription);
        logMessage(this.pc.localDescription);
        this.initSignaling();
      })
      .catch(console.error);
  }

  initSignaling() {
    var answer = {
      token: this.token,
      id: "STA_localNetwork",
      type: "offer",
      ip: this.robotIP
    };
    answer["sdp"] = this.pc.localDescription.sdp;
    console.log(answer);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answer),
    };

    fetch(`http://${window.location.hostname}:8081/offer`, options)
      .then((response) => {
        console.log(`statusCode: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log("Response from signaling server:" + JSON.stringify(data));
        logMessage("Establishing connection...");
        this.pc
          .setRemoteDescription(data)
          .then(() => {
            logMessage("WebRTC connection established");
            this.startHeartbeat();
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }

  startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      const date = new Date();
      (this.channel == null ? void 0 : this.channel.readyState) === "open" &&
        (this.channel == null ||
          this.channel.send(
            JSON.stringify({
              type: DataChannelType.HEARTBEAT,
              data: {
                timeInStr: this.formatDate(date),
                timeInNum: Math.floor(date.valueOf() / 1e3),
              },
            })
          ));
    }, 2e3);
  }

  rtcValidation(msg) {
    if (msg.data === "Validation Ok.") {
      logMessage("Validation OK");
      this.validationResult = "SUCCESS";

      // TODO: execute all the registred callbacks in a map defined
      // in the initRTC function

      // TODO this should be on the callback for video on message
      if (document.getElementById("video-frame")) {
        logMessage("Playing video");
        logMessage("Sending video on message");
        this.publish("", "on", DataChannelType.VID);

        document.getElementById("video-frame").srcObject =
          this.VidTrackEvent.streams[0];
      }
    } else {
      logMessage(`Sending validation key ${msg.data}`);
      this.publish("", encryptKey(msg.data), DataChannelType.VALIDATION); // );
    }
  }
  // Function to format date according to unitree's requirements
  formatDate(r) {
    const n = r,
      y = n.getFullYear(),
      m = ("0" + (n.getMonth() + 1)).slice(-2),
      d = ("0" + n.getDate()).slice(-2),
      hh = ("0" + n.getHours()).slice(-2),
      mm = ("0" + n.getMinutes()).slice(-2),
      ss = ("0" + n.getSeconds()).slice(-2);
    return y + "-" + m + "-" + d + " " + hh + ":" + mm + ":" + ss;
  }

  dealMsgKey(channelType, channel, id) {
    return id || `${channelType} $ ${channel}`;
  }

  saveResolve(channelType, channel, res, id) {
    const msgKey = this.dealMsgKey(channelType, channel, id),
      callback = this.msgCallbacks.get(msgKey);
    callback ? callback.push(res) : this.msgCallbacks.set(msgKey, [res]);
  }

  publish(topic, data, channelType) {
    logMessage(
      `<- msg type:${channelType} topic:${topic} data:${JSON.stringify(data)}`
    );
    return new Promise((resolve, reject) => {
      if (this.channel && this.channel.readyState === "open") {
        const msg = {
          type: channelType || DataChannelType.MSG,
          topic: topic,
          data: data,
        };
        this.channel.send(JSON.stringify(msg));
        const id =
          data && data.uuid
            ? data.uuid
            : data && data.header && data.header.identity.id;
        this.saveResolve(
          channelType || DataChannelType.MSG,
          topic,
          resolve,
          id
        );
      } else {
        console.error("data channel is not open", topic);
        reject("data channel is not open");
      }
    });
  }

  publishApi(topic, api_id, data) {
    const uniqID =
      (new Date().valueOf() % 2147483648) + Math.floor(Math.random() * 1e3);

    console.log("Command:", api_id);

    this.publish(topic, {
      header: { identity: { id: uniqID, api_id: api_id} },
      parameter: data
    });
  }

  // Function to publish a message to the robot with full header
  //  .publishReqNew(topic, { //     api_id: s.api_id,
  //     data: s.data,
  //     id: s.id,
  //     priority: !!s.priority,
  //   })
  publishReqNew(topic, msg) {
    const uniqID =
      (new Date().valueOf() % 2147483648) + Math.floor(Math.random() * 1e3);
    if (!(msg != null && msg.api_id))
      return console.error("missing api id"), Promise.reject("missing api id");
    const _msg = {
      header: {
        identity: {
          id: msg.id || uniqID,
          api_id: (msg == null ? void 0 : msg.api_id) || 0,
        },
      },
      parameter: "",
    };
    return (
      msg != null &&
        msg.data &&
        (_msg.parameter =
          typeof msg.data == "string" ? msg.data : JSON.stringify(msg.data)),
      msg != null && msg.priority && (_msg.header.policy = { priority: 1 }),
      this.publish(topic, _msg, DataChannelType.REQUEST)
      // publish(rtc, topic,  {api_id: 1016, data: 1016}, DataChannelType.REQUEST)
    );
  }
}

// TODO: to be removed, for debugging
globalThis.SPORT_CMD = SPORT_CMD;
globalThis.DataChannelType = DataChannelType;

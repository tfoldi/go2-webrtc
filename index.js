import { encryptKey } from "./utils.js";

// TODO: constants should be in a separate file
export const SPORT_CMD = {};

function defineCommand(commands, code, name) {
  commands[code] = name;
}

(function initializeCommands(commands) {
  defineCommand(commands, 1001, "Damp");
  defineCommand(commands, 1002, "BalanceStand");
  defineCommand(commands, 1003, "StopMove");
  defineCommand(commands, 1004, "StandUp");
  defineCommand(commands, 1005, "StandDown");
  defineCommand(commands, 1006, "RecoveryStand");
  defineCommand(commands, 1007, "Euler");
  defineCommand(commands, 1008, "Move");
  defineCommand(commands, 1009, "Sit");
  defineCommand(commands, 1010, "RiseSit");
  defineCommand(commands, 1011, "SwitchGait");
  defineCommand(commands, 1012, "Trigger");
  defineCommand(commands, 1013, "BodyHeight");
  defineCommand(commands, 1014, "FootRaiseHeight");
  defineCommand(commands, 1015, "SpeedLevel");
  defineCommand(commands, 1016, "Hello");
  defineCommand(commands, 1017, "Stretch");
  defineCommand(commands, 1018, "TrajectoryFollow");
  defineCommand(commands, 1019, "ContinuousGait");
  defineCommand(commands, 1020, "Content");
  defineCommand(commands, 1021, "Wallow");
  defineCommand(commands, 1022, "Dance1");
  defineCommand(commands, 1023, "Dance2");
  defineCommand(commands, 1024, "GetBodyHeight");
  defineCommand(commands, 1025, "GetFootRaiseHeight");
  defineCommand(commands, 1026, "GetSpeedLevel");
  defineCommand(commands, 1027, "SwitchJoystick");
  defineCommand(commands, 1028, "Pose");
  defineCommand(commands, 1029, "Scrape");
  defineCommand(commands, 1030, "FrontFlip");
  defineCommand(commands, 1031, "FrontJump");
  defineCommand(commands, 1032, "FrontPounce");
  defineCommand(commands, 1033, "WiggleHips");
  defineCommand(commands, 1034, "GetState");
  defineCommand(commands, 1035, "EconomicGait");
  defineCommand(commands, 1036, "FingerHeart");
})(SPORT_CMD);

const DataChannelType = {};

(function initializeDataChannelTypes(types) {
  const defineType = (r, name) => (r[name.toUpperCase()] = name.toLowerCase());

  defineType(types, "VALIDATION");
  defineType(types, "SUBSCRIBE");
  defineType(types, "UNSUBSCRIBE");
  defineType(types, "MSG");
  defineType(types, "REQUEST");
  defineType(types, "RESPONSE");
  defineType(types, "VID");
  defineType(types, "AUD");
  defineType(types, "ERR");
  defineType(types, "HEARTBEAT");
  defineType(types, "RTC_INNER_REQ");
  defineType(types, "RTC_REPORT");
  defineType(types, "ADD_ERROR");
  defineType(types, "RM_ERROR");
  defineType(types, "ERRORS");
})(DataChannelType);

// global variables sucks, but helps to debug
var rtc = null;

function logMessage(text) {
  var log = document.querySelector("#log");
  var msg = document.getElementById("log-code");
  msg.textContent += truncateString(text, 300) + "\n";
  log.scrollTop = log.scrollHeight;
}

// main function to initialize the RTC connection
// called when the connect button is clicked
function initRTC() {
  var ret = {};

  ret.msgCallbacks = new Map();
  ret.validationResult = "PENDING";

  ret.pc = new RTCPeerConnection({ sdpSemantics: "unified-plan" });
  console.log("Created RTCPeerConnection");
  logMessage("Created RTCPeerConnection");

  ret.pc.addTransceiver("video", { direction: "recvonly" }),
    ret.pc.addTransceiver("audio", { direction: "sendrecv" }),
    ret.pc.addEventListener("track", (event) => {
      event.track.kind === "video"
        ? (ret.VidTrackEvent = event)
        : (ret.AudTrackEvent = event);
    });

  ret.channel = ret.pc.createDataChannel("data");

  ret.channel.onmessage = (event) => {
    if (event.data && !event.data.includes("heartbeat")) {
      console.log("onmessage", event);
      handleDataChannelMessage(rtc, event);
    }
  };

  initSDP(ret);
  return ret;
}

function handleDataChannelMessage(rtc, event) {
  //   console.log("Data channel message received:", event.data);

  const data =
    typeof event.data == "string"
      ? JSON.parse(event.data)
      : dealArrayBuffer(event.data);

  if (data.type === DataChannelType.VALIDATION) {
    rtcValidation(rtc, data);
  }
  logMessage(`-> msg type:${event.type} data:${event.data}`);
}

function dealArrayBuffer(n) {
  const o = new Uint16Array(n.slice(0, 2)),
    s = n.slice(4, 4 + o[0]),
    c = n.slice(4 + o[0]),
    u = new TextDecoder("utf-8"),
    l = JSON.parse(u.decode(s));
  return (l.data.data = c), l;
}

// Function to format date according to unitree's requirements
function formatDate(r) {
  const n = r,
    y = n.getFullYear(),
    m = ("0" + (n.getMonth() + 1)).slice(-2),
    d = ("0" + n.getDate()).slice(-2),
    hh = ("0" + n.getHours()).slice(-2),
    mm = ("0" + n.getMinutes()).slice(-2),
    ss = ("0" + n.getSeconds()).slice(-2);
  return y + "-" + m + "-" + d + " " + hh + ":" + mm + ":" + ss;
}

function initSDP(rtc) {
  rtc.pc
    .createOffer()
    .then((offer) => rtc.pc.setLocalDescription(offer))
    .then(() => {
      console.log("Offer created");
      logMessage("Offer created");
      console.log(rtc.pc.localDescription);
      logMessage(rtc.pc.localDescription);
      initSignaling(rtc);
    })
    .catch(console.error);
}

// Function to send the offer to the signaling server
// This is where you would send the offer to the robot
function initSignaling(rtc) {
  function sendMessage(message) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    };

    fetch(
      `http://${document.getElementById("robot-ip").value}:8081/offer`,
      options
    )
      .then((response) => {
        console.log(`statusCode: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log("Response from signaling server:" + JSON.stringify(data));
        logMessage("Establishing connection...");
        rtc.pc
          .setRemoteDescription(data)
          .then(() => {
            logMessage("WebRTC connection established");
            startHeartbeat(rtc);
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }
  var answer = {
    token: document.getElementById("token").value,
    id: "STA_localNetwork",
    type: "offer",
  };
  answer["sdp"] = rtc.pc.localDescription.sdp;
  console.log(answer);
  sendMessage(answer);
}

function startHeartbeat(rtc) {
  this.heartbeatTimer = window.setInterval(() => {
    const date = new Date();
    (rtc.channel == null ? void 0 : rtc.channel.readyState) === "open" &&
      (rtc.channel == null ||
        rtc.channel.send(
          JSON.stringify({
            type: DataChannelType.HEARTBEAT,
            data: {
              timeInStr: formatDate(date),
              timeInNum: Math.floor(date.valueOf() / 1e3),
            },
          })
        ));
  }, 2e3);
}

function rtcValidation(rtc, msg) {
  if( msg.data === "Validation Ok.") {
    logMessage("Validation OK");
    rtc.validationResult = "SUCCESS";
  } else {
    logMessage(`Sending validation key ${msg.data}`);
    publish(rtc, "", encryptKey(msg.data), DataChannelType.VALIDATION); // );

    // TODO: execute all the registred callbacks in a map defined
    // in the initRTC function
    logMessage("Sending video on message");
    publish(rtc, "", "on", DataChannelType.VID);
    // TODO this should be on the callback for video on message
    logMessage("Playing video");
    document.getElementById("video-frame").srcObject = rtc.VidTrackEvent.streams[0]
  }
}

globalThis.rtcValidation = rtcValidation;

// TODO: what is the purpose of this function?
function dealMsgKey(n, o, s) {
  return s || `${n} $ ${o}`;
}

function saveResolve(rtc, channelType, channel, res, id) {
  const msgKey = dealMsgKey(channelType, channel, id),
    callback = rtc.msgCallbacks.get(msgKey);
  callback ? callback.push(res) : rtc.msgCallbacks.set(msgKey, [res]);
}

function publish(rtc, topic, data, channelType) {
  logMessage(`<- msg type:${data.type} topic:${topic} data:${data}`);
  return new Promise((resolve, reject) => {
    var ch, f, _;
    console.log("publish: ", topic, data, rtc.channel, channelType);
    ((ch = rtc.channel) == null ? void 0 : ch.readyState) === "open"
      ? (rtc.channel.send(
          JSON.stringify({
            type: channelType || DataChannelType.MSG,
            topic: topic,
            data: data,
          })
        ),
        saveResolve(
          rtc,
          channelType || DataChannelType.MSG,
          topic,
          resolve,
          data.uuid ||
            ((_ =
              (f = data == null ? void 0 : data.header) == null
                ? void 0
                : f.identity) == null
              ? void 0
              : _.id)
        ))
      : (console.error("data channel is not open", topic),
        reject("data channel is not open"));
  });
}

// Function to publish a message to the robot with full header
//  .publishReqNew(topic, { //     api_id: s.api_id,
//     data: s.data,
//     id: s.id,
//     priority: !!s.priority,
//   })
function publishReqNew(rtc, topic, msg) {
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
    // publish(rtc, topic, _msg, DataChannelType.REQUEST)
    publish(rtc, topic,  {api_id: 1016, data: 1016}, DataChannelType.REQUEST)
  );
}

// Function to load saved values from localStorage
function loadSavedValues() {
  const savedToken = localStorage.getItem("token");
  const savedRobotIP = localStorage.getItem("robotIP");

  if (savedToken) {
    document.getElementById("token").value = savedToken;
  }
  if (savedRobotIP) {
    document.getElementById("robot-ip").value = savedRobotIP;
  }
}

// Function to save values to localStorage
function saveValuesToLocalStorage() {
  const token = document.getElementById("token").value;
  const robotIP = document.getElementById("robot-ip").value;

  localStorage.setItem("token", token);
  localStorage.setItem("robotIP", robotIP);
}

// Function to handle connect button click
function handleConnectClick() {
  // You can add connection logic here
  // For now, let's just log the values
  const token = document.getElementById("token").value;
  const robotIP = document.getElementById("robot-ip").value;

  console.log("Token:", token);
  console.log("Robot IP:", robotIP);

  // Save the values to localStorage
  saveValuesToLocalStorage();

  // Initialize RTC
  rtc = initRTC();
  globalThis.rtc = rtc;

  // Send the offer to the signaling server
  //   initSignaling(rtc);
}

function handleExecuteClick() {
    const command = document.getElementById("command").value;
    console.log("Command:", command);
    publishReqNew(rtc, "rt/api/sport/request", {api_id: 1016, data: 1016})
}

function truncateString(str, maxLength) {
  if (typeof str !== "string") {
    str = JSON.stringify(str);
  }

  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  } else {
    return str;
  }
}


// Load saved values when the page loads
document.addEventListener("DOMContentLoaded", loadSavedValues);

// Attach event listener to connect button
document
  .getElementById("connect-btn")
  .addEventListener("click", handleConnectClick);

  document
  .getElementById("execute-btn")
  .addEventListener("click", handleExecuteClick);

// for debugging
globalThis.SPORT_CMD = SPORT_CMD;
globalThis.DataChannelType = DataChannelType;

// global variables sucks, but helps to debug
var rtc = null;

function logMessage(text) {
  var log = document.querySelector("#log");
  var msg = document.getElementById("log-code");
  msg.textContent += truncateString(text, 300) + "\n";
  log.scrollTop = log.scrollHeight;
}

function initRTC() {
  ret = {};

  ret.pc = new RTCPeerConnection({ sdpSemantics: "unified-plan" });
  console.log("Created RTCPeerConnection");
  logMessage("Created RTCPeerConnection");

  ret.pc.addTransceiver("video", { direction: "recvonly" }),
    ret.pc.addTransceiver("audio", { direction: "sendrecv" }),
    ret.pc.addEventListener("track", (event) => {
      event.track.kind === "video"
        ? (this.VidTrackEvent = event)
        : (this.AudTrackEvent = event);
    });

  ret.channel = ret.pc.createDataChannel("data");

  ret.channel.onmessage = (event) => {
    if (1 || (event.data && !event.data.includes("heartbeat"))) {
      console.log("onmessage", event);
    }
  };

  initSDP(ret);
  return ret;
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

function initSignaling(rtc) {
  function sendMessage(message) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    };

    fetch(`http://${document.getElementById("robot-ip").value}:8081/offer`, options)
      .then((response) => {
        console.log(`statusCode: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log("Response from signaling server:" + JSON.stringify(data));
        logMessage("Establishing connection...");
        rtc.pc.setRemoteDescription(data)
        .then(() => {
            logMessage("WebRTC connection established");
        })
        .catch((e) => {
          console.log(e);
        });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }
  answer = {
    token: document.getElementById("token").value,
    id: "STA_localNetwork",
    type: "offer",
  };
  answer["sdp"] = rtc.pc.localDescription.sdp;
  console.log(answer);
  sendMessage(answer);
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

  // Send the offer to the signaling server
  //   initSignaling(rtc);
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

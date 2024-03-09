import { Go2WebRTC } from "./go2webrtc.js";

globalThis.logMessage = console.log;

// Function to print incoming data
function setIncomingData(data) {

  console.log("setIncomingData", data);

  if (globalThis.rtc.validationResult === "SUCCESS" && data.type === DataChannelType.VALIDATION) {
    console.log("Subscribing to topic rt/utlidar/voxel_map_compressed");
    // globalThis.rtc.channel.send(
    //   JSON.stringify({
    //     type: "subscribe",
    //     topic: "rt/utlidar/voxel_map_compressed",
    //   })
    // );
  }

  if (data.type === "msg" && data.topic === "rt/utlidar/voxel_map_compressed") {
    globalThis.voxelMap = data.data;
  }
}

// Function to load saved values from localStorage
function loadSavedValues() {
  const savedToken = localStorage.getItem("token");
  const savedRobotIP = localStorage.getItem("robotIP");

  console.log("savedToken", savedToken);
  console.log("savedRobotIP", savedRobotIP);

  // Initialize RTC
//   globalThis.rtc = new Go2WebRTC(savedToken, savedRobotIP, setIncomingData);
//   globalThis.rtc.initSDP();
}

// Load saved values when the page loads
document.addEventListener("DOMContentLoaded", loadSavedValues);

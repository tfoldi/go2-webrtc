import { Go2WebRTC } from "./go2webrtc.js";

// Function to log messages to the console and the log window
function logMessage(text) {
  var log = document.querySelector("#log");
  var msg = document.getElementById("log-code");
  msg.textContent += truncateString(text, 300) + "\n";
  log.scrollTop = log.scrollHeight;
}
globalThis.logMessage = logMessage;

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

  const commandSelect = document.getElementById("command");
  Object.entries(SPORT_CMD).forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    commandSelect.appendChild(option);
  });
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
  logMessage(`Connecting to robot on ip ${robotIP}...`);

  // Save the values to localStorage
  saveValuesToLocalStorage();

  // Initialize RTC
  globalThis.rtc = new Go2WebRTC(token, robotIP);
  globalThis.rtc.initSDP();
}

function handleExecuteClick() {
  const uniqID =
    (new Date().valueOf() % 2147483648) + Math.floor(Math.random() * 1e3);
  const command = parseInt(document.getElementById("command").value);

  console.log("Command:", command);

  globalThis.rtc.publish("rt/api/sport/request", {
    header: { identity: { id: uniqID, api_id: command } },
    parameter: JSON.stringify(command),
    // api_id: command,
  });
}


function handleExecuteCustomClick() {
    const command = document.getElementById("custom-command").value;
  
    console.log("Command:", command);
  
    globalThis.rtc.channel.send(command);
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

function applyGamePadDeadzeone(value, th) {
  return Math.abs(value) > th ? value : 0
}

function joystickTick(joyLeft, joyRight) {
  let x,y,z = 0;
  let gpToUse = document.getElementById("gamepad").value;
  if (gpToUse !== "NO") {
    const gamepads = navigator.getGamepads();
    let gp = gamepads[gpToUse];
    
    // LB must be pressed
    if (gp.buttons[4].pressed == true) {
      x = -1 * applyGamePadDeadzeone(gp.axes[1], 0.25);
      y = -1 * applyGamePadDeadzeone(gp.axes[2], 0.25);
      z = -1 * applyGamePadDeadzeone(gp.axes[0], 0.25);
    } 
  } else {
     y = -1 * (joyRight.GetPosX() - 100) / 50;
     x = -1 * (joyLeft.GetPosY() - 100) / 50;
     z = -1 * (joyLeft.GetPosX() - 100) / 50;
  }

  if (x === 0 && y === 0 && z === 0) {
    return;
  }

  if (x == undefined || y == undefined || z == undefined) {
    return;
  }

  console.log("Joystick Linear:", x, y, z);

  if(globalThis.rtc == undefined) return;
  globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
}

function addJoysticks() {
  const joyConfig = {
    internalFillColor: "#FFFFFF",
    internalLineWidth: 2,
    internalStrokeColor: "rgba(240, 240, 240, 0.3)",
    externalLineWidth: 1,
    externalStrokeColor: "#FFFFFF",
  };
  var joyLeft = new JoyStick("joy-left", joyConfig);
  var joyRight = new JoyStick("joy-right", joyConfig);

  setInterval( joystickTick, 100, joyLeft, joyRight );
}

const buildGamePadsSelect = (e) => {
  const gp = navigator.getGamepads().filter(x => x != null && x.id.toLowerCase().indexOf("xbox") != -1);

  const gamepadSelect = document.getElementById("gamepad");
  gamepadSelect.innerHTML = "";

  const option = document.createElement("option");
  option.value = "NO";
  option.textContent = "Don't use Gamepad"
  option.selected = true;
  gamepadSelect.appendChild(option);  

  Object.entries(gp).forEach(([index, value]) => {
    if (!value) return
    const option = document.createElement("option");
    option.value = value.index;
    option.textContent = value.id;
    gamepadSelect.appendChild(option);
  });
};

window.addEventListener("gamepadconnected", buildGamePadsSelect);
window.addEventListener("gamepaddisconnected", buildGamePadsSelect);
buildGamePadsSelect();

// Load saved values when the page loads
document.addEventListener("DOMContentLoaded", loadSavedValues);
document.addEventListener("DOMContentLoaded", addJoysticks);

document.getElementById("gamepad").addEventListener("change", () => {
//alert("change");
});

// Attach event listener to connect button
document
  .getElementById("connect-btn")
  .addEventListener("click", handleConnectClick);

document
  .getElementById("execute-btn")
  .addEventListener("click", handleExecuteClick);

document
  .getElementById("execute-custom-btn")
  .addEventListener("click", handleExecuteCustomClick);




  document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    let x = 0, y = 0, z = 0;

    switch (key) {
        case 'w': // Forward
            x = 0.8;
            break;
        case 's': // Reverse
            x = -0.4;
            break;
        case 'a': // Sideways left
            y = 0.4;
            break;
        case 'd': // Sideways right
            y = -0.4;
            break;
        case 'q': // Turn left
            z = 2;
            break;
        case 'e': // Turn right
            z = -2;
            break;
        default:
            return; // Ignore other keys
    }

    if(globalThis.rtc !== undefined) {
        globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'a' || key === 'd' || key === 'q' || key === 'e') {
        if(globalThis.rtc !== undefined) {
            // Stop movement by sending zero velocity
            globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: 0, y: 0, z: 0}));
        }
    }
});


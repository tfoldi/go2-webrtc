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

export const DataChannelType = {};

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
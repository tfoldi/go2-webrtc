export const SPORT_CMD = {
    1001: "Damp",
    1002: "BalanceStand",
    1003: "StopMove",
    1004: "StandUp",
    1005: "StandDown",
    1006: "RecoveryStand",
    1007: "Euler",
    1008: "Move",
    1009: "Sit",
    1010: "RiseSit",
    1011: "SwitchGait",
    1012: "Trigger",
    1013: "BodyHeight",
    1014: "FootRaiseHeight",
    1015: "SpeedLevel",
    1016: "Hello",
    1017: "Stretch",
    1018: "TrajectoryFollow",
    1019: "ContinuousGait",
    1020: "Content",
    1021: "Wallow",
    1022: "Dance1",
    1023: "Dance2",
    1024: "GetBodyHeight",
    1025: "GetFootRaiseHeight",
    1026: "GetSpeedLevel",
    1027: "SwitchJoystick",
    1028: "Pose",
    1029: "Scrape",
    1030: "FrontFlip",
    1031: "FrontJump",
    1032: "FrontPounce",
    1033: "WiggleHips",
    1034: "GetState",
    1035: "EconomicGait",
    1036: "FingerHeart",
  };
  
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
# Copyright (c) 2024, RoboVerse community
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import asyncio
import json
import os
import pygame

from go2_webrtc import Go2Connection, ROBOT_CMD


JOY_SENSE = 0.2


def gen_command(cmd: int):
    command = {
        "type": "msg",
        "topic": "rt/api/sport/request",
        "data": {
            "header": {"identity": {"id": Go2Connection.generate_id(), "api_id": cmd}},
            "parameter": json.dumps(cmd),
        },
    }
    command = json.dumps(command)
    return command


def gen_mov_command(x: float, y: float, z: float):
    x = x * JOY_SENSE
    y = y * JOY_SENSE

    command = {
        "type": "msg",
        "topic": "rt/api/sport/request",
        "data": {
            "header": {"identity": {"id": Go2Connection.generate_id(), "api_id": 1008}},
            "parameter": json.dumps({"x": x, "y": y, "z": z}),
        },
    }
    command = json.dumps(command)
    return command


async def get_joystick_values():
    pygame.init()
    pygame.joystick.init()

    if pygame.joystick.get_count() > 0:
        joystick = pygame.joystick.Joystick(0)
        joystick.init()

        axis0 = round(joystick.get_axis(0), 1) * -1
        axis1 = round(joystick.get_axis(1), 1) * -1
        axis2 = round(joystick.get_axis(2), 1) * -1
        axis3 = round(joystick.get_axis(3), 1) * -1
        btn_a_is_pressed = joystick.get_button(0)
        btn_b_is_pressed = joystick.get_button(1)

        return {
            "Axis 0": axis0,
            "Axis 1": axis1,
            "Axis 2": axis2,
            "Axis 3": axis3,
            "a": btn_a_is_pressed,
            "b": btn_b_is_pressed,
        }

    return {"Axis 0": 0, "Axis 1": 0, "Axis 2": 0, "Axis 3": 0, "a": 0, "b": 0}


async def start_joy_bridge(robot_conn):
    await robot_conn.connect_robot()

    while True:
        joystick_values = await get_joystick_values()
        joy_move_x = joystick_values["Axis 1"]
        joy_move_y = joystick_values["Axis 0"]
        joy_move_z = joystick_values["Axis 2"]
        joy_btn_a_is_pressed = joystick_values["a"]
        joy_btn_b_is_pressed = joystick_values["b"]

        if joy_btn_a_is_pressed == 1:
            robot_cmd = gen_command(ROBOT_CMD["StandUp"])
            robot_conn.data_channel.send(robot_cmd)

        if joy_btn_b_is_pressed == 1:
            robot_cmd = gen_command(ROBOT_CMD["StandDown"])
            robot_conn.data_channel.send(robot_cmd)

        if abs(joy_move_x) > 0.0 or abs(joy_move_y) > 0.0 or abs(joy_move_z) > 0.0:
            robot_cmd = gen_mov_command(joy_move_x, joy_move_y, joy_move_z)
            robot_conn.data_channel.send(robot_cmd)

        await asyncio.sleep(0.1)


async def main():
    conn = Go2Connection(
        os.getenv("GO2_IP"),
        os.getenv("GO2_TOKEN"),
    )

    coroutine = await start_joy_bridge(conn)

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(coroutine)
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(conn.pc.close())


asyncio.run(main())

#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import json
import sys
import os

sys.path.insert(1, os.path.realpath(os.path.pardir))

from moneysocket.beacon.shared_seed import SharedSeed

from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.beacon.location.webrtc import WebRtcLocation
from moneysocket.beacon.location.bluetooth import BluetoothLocation
from moneysocket.beacon.location.nfc import NfcLocation



def test_beacon(beacon):
    print(json.dumps(beacon.to_dict(), indent=1))
    b32 = beacon.to_bech32_str()
    print("")
    print(b32)
    print("")
    print(b32.upper())
    print("")
    beacon2, err = MoneysocketBeacon.from_bech32_str(b32)
    print("err: %s" % err)
    print(json.dumps(beacon2.to_dict(), indent=1))
    print("\n")


ss = SharedSeed()

b1 = MoneysocketBeacon(shared_seed=ss)
b1.add_location(WebsocketLocation("relay.socket.money"))
b1.add_location(WebRtcLocation())
b1.add_location(BluetoothLocation())
b1.add_location(NfcLocation())

test_beacon(b1)

b2 = MoneysocketBeacon(shared_seed=ss)
b2.add_location(WebsocketLocation("relay.socket.money"))

test_beacon(b2)

b3 = MoneysocketBeacon(shared_seed=ss)
b3.add_location(WebsocketLocation("relay.socket.money", use_tls=False,
                                  port=666))

test_beacon(b3)

#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import json
import sys
import os

sys.path.insert(1, os.path.realpath(os.path.pardir))

#print(sys.modules)

from moneysocket.core.message.request.ping import RequestPing
from moneysocket.core.message.request.rendezvous import RequestRendezvous
from moneysocket.core.message.notification.pong import NotifyPong
from moneysocket.core.message.notification.rendezvous import NotifyRendezvous
from moneysocket.core.message.notification.rendezvous_becoming_ready import (
    NotifyRendezvousBecomingReady)

from moneysocket.core.message.message import MoneysocketMessage
from moneysocket.core.message.crypt import MoneysocketCrypt
from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)
from moneysocket.core.message.request.request import MoneysocketRequest

from moneysocket.beacon.shared_seed import SharedSeed

def encode_decode(msg, ss):
    e = MoneysocketCrypt.wire_encode(msg, shared_seed=ss)
    print(e.hex())

    d, err = MoneysocketCrypt.wire_decode(e, shared_seed=ss)
    print(err)
    print(d)
    return d

ss = SharedSeed()
sss = str(ss)
print("shared seed: %s" % sss)
ss2 = SharedSeed.from_hex_string(sss)
print("shared seed decoded: %s" % ss2)

rid = ss2.derive_rendezvous_id()

p = RequestPing()

p2 = encode_decode(p, ss)

print("\n")

o = NotifyPong(p2['request_uuid'])

o2 = encode_decode(o, ss)


rr = RequestRendezvous(rid.hex())

rr2 = encode_decode(rr, ss)

nrbr = NotifyRendezvousBecomingReady(rid.hex(), rr2['request_uuid'])

nrbr2 = encode_decode(nrbr, ss)

nr = NotifyRendezvous(rid.hex(), rr2['request_uuid'])

nr2 = encode_decode(nr, ss)

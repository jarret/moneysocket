#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import json
import sys
import os

#print(sys.modules)

from moneysocket.core.message.request.ping import RequestPing
from moneysocket.core.message.request.rendezvous import RequestRendezvous
from moneysocket.core.message.notification.pong import NotifyPong
from moneysocket.core.message.notification.rendezvous import NotifyRendezvous
from moneysocket.core.message.notification.rendezvous_becoming_ready import (
    NotifyRendezvousBecomingReady)

from moneysocket.core.message.message import MoneysocketMessage
from moneysocket.core.message.crypt import MoneysocketCrypt
from moneysocket.core.message.notification.notification import MoneysocketNotification
from moneysocket.core.message.request.request import MoneysocketRequest

from moneysocket.core.shared_seed import SharedSeed

#print(MoneysocketMessage.MESSAGE_SUBCLASSES)
#print(MoneysocketNotification.NOTIFICATION_SUBCLASSES)
#print(MoneysocketRequest.REQUEST_SUBCLASSES)

#key = os.urandom(16)
#
#print(key)
#
#e = MoneysocketCrypt.encode(p, shared_seed=key)
#
#print(e.hex())
#
#d, err = MoneysocketCrypt.decode(e, shared_seed=key)
#
#print(err)
#print(d)

ss = SharedSeed()
sss = str(ss)
print("shared seed: %s" % sss)


s2 = SharedSeed.from_hex_string(sss)

print(s2)

p = RequestPing()
e = MoneysocketCrypt.encode(p, shared_seed=ss)
print(e.hex())

d, err = MoneysocketCrypt.decode(e, shared_seed=ss)
print(err)
print(d)

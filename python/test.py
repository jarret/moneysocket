#!/usr/bin/env python3


import json
import sys
import os

#print(sys.modules)

from moneysocket.core.message.request.ping import RequestPing
from moneysocket.core.message.request.rendezvous import RequestRendezvous
from moneysocket.core.message.notification.pong import NotifyPong

from moneysocket.core.message.message import MoneysocketMessage
from moneysocket.core.message.crypt import MoneysocketCrypt
from moneysocket.core.message.notification.notification import MoneysocketNotification
from moneysocket.core.message.request.request import MoneysocketRequest


print(MoneysocketMessage.MESSAGE_SUBCLASSES)
print(MoneysocketNotification.NOTIFICATION_SUBCLASSES)
print(MoneysocketRequest.REQUEST_SUBCLASSES)


p = RequestPing()
txt = p.to_json()

print(txt)

p2, err = MoneysocketMessage.from_text(txt)

print(err)

print(p2.to_json())

key = os.urandom(16)

print(key)

e = MoneysocketCrypt.encode(p, shared_seed=key)

print(e.hex())

d, err = MoneysocketCrypt.decode(e, shared_seed=key)

print(err)
print(d)

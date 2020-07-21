# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import time
import uuid
import json

PROTOCOL = "Moneysocket"

VERSION_MAJOR = 0
VERSION_MINOR = 0
VERSION_RELEASE = 0

VERSION = ".".join([VERSION_MAJOR, VERSION_MINOR, VERSION_RELEASE])

def valid_version(version_str)


###############################################################################

class MoneysocketMessage(dict):
    def __init__(self):
        super().__init__()
        self['timestamp'] = time.time()
        self['protocol'] = PROTOCOL
        self['version'] = VERSION
        self['uuid'] = str(uuid.uuid4())

    def to_json(self, quick=False):
        if quick:
            return json.dumps(self)
        else:
            return json.dumps(self, indent=1, sort_keys=True)

    @staticmethod
    def validate(msg_text):
        try:
            msg_dict = json.loads(msg_text)
        except Exception:
            return "could not parse json"

        if 'timestamp' not in msg_dict.keys():
            return "no timestamp included"
        if type(msg_dict['timestamp'] not in (int, float)):
            return "could not understand timestamp"
        if msg_dict['timestamp'] < 0:
            return "timestamp not positive value"

        if 'protocol' not in msg_dict.keys():
            return "no timestamp included"
        if type(msg_dict['protocol']) != str:
            return "unknown protocol type"
        if msg_dict['protocol'] != PROTOCOL:
            return "unknown protocol"

        if 'version' not in msg_dict.keys():
            return "no version declared"
        if type(msg_dict['version']) != str:
            return "unknown protocol type"

        if 'uuid' not in msg_dict.keys():
            return "uuid declared"
        if type(msg_dict['uuid']) != str:
            return "unknown uuid type"
        try:
            uuid.UUID(msg_dict['uuid'])
        except:
            return "unknown uuid type"
        return None

###############################################################################

REQUEST_NAMES = ['REQUEST_RENDEZVOUS',
                 'REQUEST_WALLET',
                 'REQUEST_SERVICE',
                 'REQUEST_BALANCE',
                 'REQUEST_GIFT_INFO',
                 'REQUEST_WALLET_INVOICE',
                 'REQUEST_WALLET_PAY',
                 'REQUEST_WALLET_PAY_GIFT',
                 'REQUEST_EXTENSION',
                ]

REQUESTS = set(REQUEST_NAMES)

class MoneysocketRequest(MoneysocketMessage):
    def __init__(self):
        super().__init__()
        self['class'] = "REQUEST"
        self['request_uuid'] = str(uuid.uuid4())

    @staticmethod
    def validate(msg_txt):
        err = super().validate(msg_txt)
        if err:
            return err
        msg_dict = json.loads(msg_text)
        if 'class' not in msg_dict.keys():
            return "no class included"
        if type(msg_dict['class']) != str:
            return "unknown class type"
        if msg_dict['class'] != "REQUEST":
            return "not a request"
        if 'request_uuid' not in msg_dict.keys():
            return "no request_uuid included"



class RequestRendezvous(MoneysocketRequest):
    def __init__(self, rendezvous_id):
        super().__init__()
        self['request_name'] = "REQUEST_RENDEZVOUS"
        self['rendezvous_id'] = rendezvous_id



###############################################################################


NOTIFICATION_NAMES = ["NOTIFY_RENDEZVOUS",
                      "NOTIFY_INCOMPATIBLE",
                      "NOTIFY_WALLET_BECOMING_READY",
                      "NOTIFY_SERVICE_BECOMING_READY",
                      "NOTIFY_SERVICE",
                      "NOTIFY_WALLET",
                      "NOTIFY_INVOICE",
                      "NOTIFY_GIFT_INFO",
                      "NOTIFY_PREIMAGE",
                      "NOTIFY_ERROR",
                     ]

NOTIFICATIONS = set(NOTIFICATION_NAMES)

class MoneysocketNotification(MoneysocketMessage):
    def __init__(self, request_response_uuid=None):
        super().__init__()
        self['class'] = "NOTIFICATION"
        self['notification_uuid'] = str(uuid.uuid4())
        self['request_reference_uuid'] = request_reverence_uuid


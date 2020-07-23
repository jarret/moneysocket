# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys
import time
import uuid
import json
import string

PROTOCOL = "Moneysocket"

VERSION_MAJOR = 0
VERSION_MINOR = 0
VERSION_RELEASE = 0

VERSION = ".".join(str(v) for v in [VERSION_MAJOR, VERSION_MINOR,
                                    VERSION_RELEASE])


###############################################################################

class MoneysocketMessage(dict):
    MESSAGE_SUBCLASSES = {}
    MUST_BE_CLEARTEXT = False

    def __init__(self, message_class):
        super().__init__()
        self['timestamp'] = time.time()
        self['protocol'] = PROTOCOL
        self['protocol_version'] = VERSION
        self['message_class'] = message_class

    def to_json(self, quick=False):
        if quick:
            return json.dumps(self)
        else:
            return json.dumps(self, indent=1, sort_keys=True)

    @staticmethod
    def cast_class(msg_dict):
        message_class = MoneysocketMessage.MESSAGE_SUBCLASSES[
            msg_dict['message_class']]
        return message_class.cast_class(msg_dict)


    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'message_class' not in msg_dict.keys():
            return "no message_class included"
        if type(msg_dict['message_class']) != str:
            return "unknown message_class type"
        if (msg_dict['message_class'] not in
            MoneysocketMessage.MESSAGE_SUBCLASSES.keys()):
            return "not a known message"
        if 'timestamp' not in msg_dict.keys():
            return "no timestamp included"

        if type(msg_dict['timestamp']) not in {int, float}:
            return "could not understand timestamp"
        if msg_dict['timestamp'] < 0:
            return "timestamp not positive value"

        if 'protocol' not in msg_dict.keys():
            return "no timestamp included"
        if type(msg_dict['protocol']) != str:
            return "unknown protocol type"
        if msg_dict['protocol'] != PROTOCOL:
            return "unknown protocol"

        if 'protocol_version' not in msg_dict.keys():
            return "no protocol_version declared"
        if type(msg_dict['protocol_version']) != str:
            return "unknown protocol type"

        subclass = MoneysocketMessage.MESSAGE_SUBCLASSES[
            msg_dict['message_class']]
        return subclass.check_valid_msg_dict(msg_dict)


    @staticmethod
    def from_text(msg_text):
        try:
            msg_dict = json.loads(msg_text)
        except Exception:
            return None, "could not parse json"
        err = MoneysocketMessage.check_valid_msg_dict(msg_dict)
        if err:
            return None, err
        return MoneysocketMessage.cast_class(msg_dict), None



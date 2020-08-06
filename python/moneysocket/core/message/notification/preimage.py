# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyPreimage(MoneysocketNotification):
    MUST_BE_CLEARTEXT = False

    def __init__(self, preimage, ext=None, request_reference_uuid=None):
        super().__init__("NOTIFY_PREIMAGE",
                         request_reference_uuid=request_reference_uuid)
        self['preimage'] = preimage
        self['ext'] = ext

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyPreimage(msg_dict['preimage'],
                           msg_dict['ext'],
                           msg_dict['request_reference_uuid'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'preimage' not in msg_dict.keys():
            return "no preimage included"
        if type(msg_dict['preimage']) != str:
            return "unknown preimage type"
        if not all(c in string.hexdigits for c in msg_dict['preimage']):
            return "preimage not hex string"
        if len(msg_dict['preimage']) != 64:
            return "preimage not 256-bit value hex string"
        if msg_dict['ext'] != None:
            if type(msg_dict['ext']) != str:
                return "unknown ext type"
            if len(msg_dict['ext']) > 4096:
                return "ext is larger than 4096 characters"
        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_PREIMAGE'] = (
    NotifyPreimage)


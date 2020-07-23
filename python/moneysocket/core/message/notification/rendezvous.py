# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyRendezvous(MoneysocketNotification):
    MUST_BE_CLEARTEXT = True

    def __init__(self, rendezvous_id, request_reference_uuid):
        super().__init__("NOTIFY_RENDEZVOUS",
                         request_reference_uuid=request_reference_uuid)
        self['rendezvous_id'] = rendezvous_id

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyRendezvous(msg_dict['rendezvous_id'],
                             msg_dict['request_reference_uuid'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'rendezvous_id' not in msg_dict.keys():
            return "no rendezvous_id included"
        if type(msg_dict['rendezvous_id']) != str:
            return "unknown rendezvous_id type"
        if not all(c in string.hexdigits for c in msg_dict['rendezvous_id']):
            return "rendezvous_id not hex string"
        if len(msg_dict['rendezvous_id']) != 64:
            return "rendezvous_id not 256-bit value hex string"

        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_RENDEZVOUS'] = (
    NotifyRendezvous)


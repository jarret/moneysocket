# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyInvoice(MoneysocketNotification):
    MUST_BE_CLEARTEXT = False

    def __init__(self, bolt11, request_reference_uuid):
        super().__init__("NOTIFY_INVOICE",
                         request_reference_uuid=request_reference_uuid)
        self['bolt11'] = bolt11

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyInvoice(msg_dict['bolt11'],
                          msg_dict['request_reference_uuid'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'bolt11' not in msg_dict.keys():
            return "no bolt11 included"
        if type(msg_dict['bolt11']) != str:
            return "unknown bolt11 type"
        #TODO full parse to make sure it includes amount
        if not msg_dict['bolt11'].startswith("lnbc"):
            return "doesn't look like a bolt11"

        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_INVOICE'] = (
    NotifyInvoice)


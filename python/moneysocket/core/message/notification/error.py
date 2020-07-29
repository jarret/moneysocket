# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyError(MoneysocketNotification):
    MUST_BE_CLEARTEXT = False

    def __init__(self, error_msg, request_reference_uuid=None):
        super().__init__("NOTIFY_ERROR",
                         request_reference_uuid=request_reference_uuid)
        self['error_msg'] = error_msg

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyError(msg_dict['error_msg'],
                        request_reference_id=msg_dict['request_reference_uuid'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'error_msg' not in msg_dict.keys():
            return "no error_msg included"
        if type(msg_dict['error_msg']) != str:
            return "unknown error_msg type"
        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_ERROR'] = NotifyError


# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.core.message.notification.notification import (
    MoneysocketNotification)

class NotifyPong(MoneysocketNotification):
    def __init__(self, request_reference_uuid):
        super().__init__("NOTIFY_PONG",
                         request_reference_uuid=request_reference_uuid)


    @staticmethod
    def cast_class(msg_dict):
        c = NotifyPong(msg_dict['request_reference_uuid'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        return None

MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_PONG'] = NotifyPong

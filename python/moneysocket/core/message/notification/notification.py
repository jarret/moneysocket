# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid

from moneysocket.core.message.message import MoneysocketMessage


class MoneysocketNotification(MoneysocketMessage):
    NOTIFICATION_SUBCLASSES = {}

    def __init__(self, notification_name, request_reference_uuid=None):
        super().__init__("NOTIFICATION")
        self['notification_uuid'] = str(uuid.uuid4())
        self['request_reference_uuid'] = request_reference_uuid
        self['notification_name'] = notification_name


    @staticmethod
    def cast_class(msg_dict):
        notification_class = MoneysocketNotification.NOTIFICATION_SUBCLASSES[
            msg_dict['notification_name']]
        return notification_class.cast_class(msg_dict)

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'notification_uuid' not in msg_dict.keys():
            return "no notification_uuid included"
        if type(msg_dict['notification_uuid']) != str:
            return "unknown notification_uuid type"
        try:
            _ = uuid.UUID(msg_dict['notification_uuid'])
        except:
            return "invalid notification_uuid"

        if 'request_reference_uuid' not in msg_dict.keys():
            return "no request_reference_uuid included"

        if msg_dict['request_reference_uuid'] is not None:
            if type(msg_dict['request_reference_uuid']) != str:
                return "unknown request_reference_uuid type"
            try:
                _ = uuid.UUID(msg_dict['request_reference_uuid'])
            except:
                return "invalid request_reference_uuid"

        if 'notification_name' not in msg_dict.keys():
            return "invalid notification_name"
        if type(msg_dict['notification_name']) != str:
            return "unknown notification_name type"
        if (msg_dict['notification_name'] not in
            MoneysocketNotification.NOTIFICATION_SUBCLASSES.keys()):
            return "unknown notification_name: %s" % (
                msg_dict['notification_name'])
        subclass = MoneysocketNotification.NOTIFICATION_SUBCLASSES[
            msg_dict['notification_name']]
        return subclass.check_valid_msg_dict(msg_dict)


MoneysocketMessage.MESSAGE_SUBCLASSES['NOTIFICATION'] = MoneysocketNotification

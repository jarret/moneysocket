# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid

from moneysocket.core.message.message import MoneysocketMessage


class MoneysocketRequest(MoneysocketMessage):
    REQUEST_SUBCLASSES = {}

    def __init__(self, request_name):
        super().__init__("REQUEST")
        self['request_uuid'] = str(uuid.uuid4())
        self['request_name'] = request_name

    @staticmethod
    def cast_class(msg_dict):
        request_class = MoneysocketRequest.REQUEST_SUBCLASSES[
            msg_dict['request_name']]
        return request_class.cast_class(msg_dict)

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'request_uuid' not in msg_dict.keys():
            return "no request_uuid included"
        if type(msg_dict['request_uuid']) != str:
            return "unknown request_uuid type"
        try:
            _ = uuid.UUID(msg_dict['request_uuid'])
        except:
            return "invalid request_uuid"

        if 'request_name' not in msg_dict.keys():
            return "invalid request_name"
        if type(msg_dict['request_name']) != str:
            return "unknown request_name type"
        if (msg_dict['request_name'] not in
            MoneysocketRequest.REQUEST_SUBCLASSES.keys()):
            return "unknown request_name: %s" % msg_dict['request_name']

        subclass = MoneysocketRequest.REQUEST_SUBCLASSES[
            msg_dict['request_name']]
        return subclass.check_valid_msg_dict(msg_dict)


MoneysocketMessage.MESSAGE_SUBCLASSES['REQUEST'] = MoneysocketRequest

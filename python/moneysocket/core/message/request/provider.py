# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.request.request import MoneysocketRequest

class RequestProvider(MoneysocketRequest):
    MUST_BE_CLEARTEXT = False

    def __init__(self):
        super().__init__("REQUEST_PROVIDER")

    @staticmethod
    def cast_class(msg_dict):
        c = RequestProvider()
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        return None


MoneysocketRequest.REQUEST_SUBCLASSES['REQUEST_PROVIDER'] = RequestProvider


# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.request.request import MoneysocketRequest

class RequestInvoice(MoneysocketRequest):
    MUST_BE_CLEARTEXT = False

    def __init__(self, msats):
        super().__init__("REQUEST_INVOICE")
        self['msats'] = msats

    @staticmethod
    def cast_class(msg_dict):
        c = RequestInvoice(msg_dict['msats'])
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'msats' not in msg_dict.keys():
            return "no msats included"
        if type(msg_dict['msats']) != int:
            return "unknown msats type"
        if msg_dict['msats'] <= 0:
            return "msats must be a positive non-zer integer"
        return None


MoneysocketRequest.REQUEST_SUBCLASSES['REQUEST_INVOICE'] = RequestInvoice


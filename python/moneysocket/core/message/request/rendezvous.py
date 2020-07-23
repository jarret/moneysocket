# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from moneysocket.core.message.request.request import MoneysocketRequest

class RequestRendezvous(MoneysocketRequest):
    MUST_BE_CLEARTEXT = True

    def __init__(self, rendezvous_id):
        super().__init__("REQUEST_RENDEZVOUS")
        self['rendezvous_id'] = rendezvous_id

    @staticmethod
    def cast_class(msg_dict):
        c = RequestRendezvous(msg_dict['rendezvous_id'])
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


MoneysocketRequest.REQUEST_SUBCLASSES['REQUEST_RENDEZVOUS'] = RequestRendezvous


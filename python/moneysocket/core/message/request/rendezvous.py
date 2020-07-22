# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json

from core.message.request.request import MoneysocketRequest

class RequestRendezvous(MoneysocketRequest):
    def __init__(self, rendezvous_id):
        super().__init__("REQUEST_RENDEZVOUS")
        self['rendezvous_id'] = rendezvous_id

    @staticmethod
    def check_valid(msg_txt):
        err = super().validate(msg_txt)
        if err:
            return err
        msg_dict = json.loads(msg_text)

        if 'rendevous_id' not in msg_dict.keys():
            return "no rendezvous_id included"
        if type(msg_dict['rendezvous_id']) != str:
            return "unknown rendezvous_id type"

        if not all(c in string.hexdigits for c in msg_dict['rendezvous_id']):
            return "rendezvous_id not hex string"
        if len(msg_dict['rendezvous_id']) != 16:
            return "rendezvous_id not 64-bit value hex string"
        return None

# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from core.message.request.request import MoneysocketRequest


class RequestPing(MoneysocketRequest):
    def __init__(self):
        super().__init__("REQUEST_PING")

    @staticmethod
    def check_valid(msg_txt):
        return super().validate(msg_txt)

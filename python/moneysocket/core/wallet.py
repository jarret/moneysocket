# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.core.role import Role

from moneysocket.core.message.notification.provider import NotifyProvider

class Wallet(Role):
    """ LN WALLET role """
    def __init__(self, name, msatoshis):
        super().__init__(name)
        self.msatoshis = msatoshis
        self.payee = True
        self.payer = True

    def get_notify_msg(self, request_reference_uuid=None):
        return NotifyProvider(self.uuid,
            request_reference_uuid=request_reference_uuid, payer=self.payer,
            payee=self.payee, msats=self.msatoshis)

    def iter_attributes(self):
        for name, attribute in super().iter_attributes():
            yield name, attribute
        yield "msatoshis", self.msatoshis

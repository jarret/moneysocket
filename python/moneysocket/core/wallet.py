# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import hashlib

from moneysocket.core.role import Role

from moneysocket.core.message.notification.provider import NotifyProvider
from moneysocket.utl.bolt11 import Bolt11

class Wallet(Role):
    """ LN WALLET role """
    def __init__(self, name, msatoshis):
        super().__init__(name)
        self.msatoshis = msatoshis
        self.payee = True
        self.payer = True
        self.pending_payment_hashes = set()

    def get_notify_msg(self, request_reference_uuid=None):
        return NotifyProvider(self.uuid,
            request_reference_uuid=request_reference_uuid, payer=self.payer,
            payee=self.payee, msats=self.msatoshis)

    def decrement_msats(self, delta_msats):
        self.msatoshis -= delta_msats

    def increment_msats(self, delta_msats):
        self.msatoshis += delta_msats

    def iter_attributes(self):
        for name, attribute in super().iter_attributes():
            yield name, attribute
        yield "msatoshis", self.msatoshis

    ###########################################################################

    def preimage2ph(self, preimage):
        return hashlib.sha256(preimage).hexdigest()

    def is_pending(self, preimage):
        payment_hash = self.preimage2ph(bytes.fromhex(preimage))
        return payment_hash in self.pending_payment_hashes

    def remove_pending(self, preimage):
        payment_hash = self.preimage2ph(bytes.fromhex(preimage))
        self.pending_payment_hashes.remove(payment_hash)

    def add_pending(self, bolt11):
        d = Bolt11.to_dict(bolt11)
        self.pending_payment_hashes.add(d['payment_hash'])

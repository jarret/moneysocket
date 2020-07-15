# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.core.role import Role


class Wallet(Role):
    """ LN WALLET role """
    def __init__(self, name, msatoshis):
        super().__init__(name)
        self.msatoshis = msatoshis

    def iter_attributes(self):
        for name, attribute in super().iter_attributes():
            yield name, attribute
        yield "msatoshis", self.msatoshis

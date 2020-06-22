# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid

from autobahn.twisted.websocket import WebSocketServerFactory

from moneysocket.client import MoneysocketClient
from moneysocket.state_db import StateDb

###############################################################################

class MoneysocketServer(WebSocketServerFactory):
    def __init__(self, ws_url, state_filename, lightning_node):
        super().__init__(ws_url)

        self.clients = {}
        self.protocol = MoneysocketClient
        self.protocol.server = self
        self.protocol.lightning_node = lightning_node
        self.db = StateDb(lightning_node, state_filename)
        self.lightning_node = lightning_node
        self.lightning_node.register_server(self)

    def get_balance(self):
        return self.db.get_balance()

    def notify_new_balance(self):
        balance = self.get_balance()
        for client in self.clients.values():
            client.send_balance_notification(balance)

    def notify_invoice_paid(self, preimage, msats):
        self.db.add_preimage(preimage)
        self.notify_new_balance()

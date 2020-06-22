# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import json

from base64 import b64encode

from autobahn.twisted.websocket import WebSocketServerProtocol

from moneysocket.bolt11 import Bolt11

class MoneysocketClient(WebSocketServerProtocol):

    ###########################################################################

    def onConnect(self, request):
        self.uuid = uuid.uuid4()
        self.lightning_node.log("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        self.server.clients[self.uuid] = self
        self.lightning_node.log("WebSocket connection open.")
        self.send_balance_notification(self.get_balance())

    def onMessage(self, payload, isBinary):
        if isBinary:
            self.lightning_node.log(
                "Binary message received: {0} bytes".format( len(payload)))
            self.lightning_node.log(
                "Binary message received: %s" % payload.hex())
        else:
            decoded = payload.decode('utf8')
            self.lightning_node.log(
                "Text message received: {0}".format(decoded))
            self.handle_request(decoded)

    def onClose(self, wasClean, code, reason):
        self.lightning_node.log(
            "WebSocket connection closed: {0}".format(reason))
        if not hasattr(self, "uuid"):
            return
        if self.uuid in self.server.clients.keys():
            del self.server.clients[self.uuid]

    ###########################################################################

    def get_balance(self):
        return self.server.get_balance()

    def handle_request(self, request):
        r = json.loads(request)
        print("request: %s" % r)
        if r['request_type'] == "GET_INVOICE":
            bolt11 = self.get_bolt11(r['msat_amount'])
            self.send_bolt11_notification(bolt11)
        elif r['request_type'] == "PAY_INVOICE":
            preimage = self.pay_bolt11(r['bolt11'])
            self.send_preimage_notification(preimage)
            self.server.notify_new_balance()
        elif r['request_type'] == "GET_BALANCE":
            self.send_balance_notification(self.get_balance())
        else:
            print("unknown request")
            return

    ###########################################################################

    def send_notification(self, notification):
        encoded = json.dumps(notification).encode("utf8")
        print("encoded to send: %s" % encoded)
        r = self.sendMessage(encoded)
        print("sent: %s" % r)

    def send_bolt11_notification(self, bolt11):
        n = {'notification_type': "INVOICE",
             'bolt11':            bolt11}
        self.send_notification(n)

    def send_preimage_notification(self, preimage):
        n = {'notification_type': "PREIMAGE",
             'preimage':          preimage}
        self.send_notification(n)

    def send_balance_notification(self, msat_balance):
        n = {'notification_type': "BALANCE",
             'msats':             msat_balance}
        self.send_notification(n)

    ###########################################################################

    def get_bolt11(self, msat_amount):
        bolt11 = self.lightning_node.get_invoice(msat_amount)
        print("got: %s" % Bolt11.to_dict(bolt11))
        self.server.db.add_pending(bolt11)
        return bolt11

    def pay_bolt11(self, bolt11):
        print("paying: %s" % Bolt11.to_dict(bolt11))
        preimage, msats = self.lightning_node.pay_invoice(bolt11)
        self.server.db.add_paid(msats)
        return preimage

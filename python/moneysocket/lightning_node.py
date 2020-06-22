# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys
import uuid
import json

from base64 import b64encode

from twisted.internet import reactor


class LightningNode(object):
    def __init__(self):
        self.server = None

    def register_server(self, server):
        self.server = server

    def get_invoice(self, msat_amount):
        sys.exit("implement in subclass")

    def pay_invoice(self, bolt11):
        sys.exit("implement in subclass")

    def log(self, s):
        sys.exit("implement in subclass")



class CLightningNode(LightningNode):
    def __init__(self, plugin):
        super().__init__()
        self.plugin = plugin
        self.log("subscribing")
        plugin.add_subscription("invoice_payment", self.handle_invoice_payment)

    def log(self, s):
        self.plugin.log(s)

    ###########################################################################

    def _gen_new_label(self):
        label_bytes = uuid.uuid4().bytes
        label_str = b64encode(label_bytes).decode('utf8')
        return label_str

    def get_invoice(self, msat_amount):
        self.log("getting invoice: %smsats" % msat_amount)
        label = self._gen_new_label()
        i = self.plugin.rpc.invoice(msat_amount, label, "a description")
        self.log("got: %s" % i)
        return i['bolt11']

    def pay_invoice(self, bolt11):
        self.log("paying invoice: %s" % bolt11)
        r = self.plugin.rpc.pay(bolt11)
        self.log("paid?: %s" % r)
        return r['payment_preimage'], r['msatoshi_sent']

    ###########################################################################

    def handle_invoice_payment(self, *args, **kwargs):
        #self.log("HANDLE")
        #self.log("args: %s" % str(args))
        self.log("kwargs: %s" % str(kwargs))
        msats = int(str(kwargs['invoice_payment']['msat'])[:-4])
        preimage = kwargs['invoice_payment']['preimage']
        print
        self.log("msats: %s" % msats)
        self.log("preimage: %s" % preimage)
        reactor.callFromThread(self.server.notify_invoice_paid, preimage,
                               msats)


class LndNode(LightningNode):
    def __init__(self, client):
        super().__init__()
        self.client = client
        reactor.callLater(1.0, self.check_for_paid)

    def log(self, s):
        print(s)

    ###########################################################################

    def get_invoice(self, msat_amount):
        self.log("getting invoice: %smsats" % msat_amount)
        sat_amount = int(round(msat_amount / 1000.0))
        i = self.client.add_invoice("a description", sat_amount)
        self.log("got: %s" % i)
        return i.payment_request

    def pay_invoice(self, bolt11):
        self.log("paying invoice: %s" % bolt11)
        r = self.client.pay_invoice(bolt11)
        print(r)
        self.log("paid?: %s" % r)
        self.log("route: %s" % r.payment_route)
        return r.payment_preimage.hex(), r.payment_route.total_amt_msat

    ###########################################################################

    def check_for_paid(self):
        # TODO - this polling sucks, figure out how to subscribe to grpc for
        # notifications.
        pending = self.server.db.get_pending_payment_hashes()
        for p in pending:
            l = self.client.lookup_invoice(r_hash_str=p)
            if l.state == 1:
                self.server.notify_invoice_paid(l.r_preimage.hex(),
                                                l.amt_paid)

        reactor.callLater(1.0, self.check_for_paid)

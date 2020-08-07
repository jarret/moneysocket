# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid
import hashlib

from base64 import b64encode

from twisted.internet import reactor

from moneysocket.utl.bolt11 import Bolt11
from moneysocket.lightning.lightning import Lightning


class Lnd(Lightning):
    def __init__(self, lnd_client):
        super().__init__()
        self.lnd_client = lnd_client
        self.pending_payment_hashes = set()
        reactor.callLater(1.0, self.check_for_paid)

    def log(self, s):
        print(s)

    ###########################################################################

    def get_invoice(self, msat_amount):
        logging.info("getting invoice: %smsats" % msat_amount)
        sat_amount = int(round(msat_amount / 1000.0))
        i = self.lnd_client.add_invoice("", sat_amount)
        logging.info("got: %s" % i)
        payment_hash = Bolt11.to_dict(i.payment_request)['payment_hash']
        self.pending_payment_hashes.add(payment_hash)
        # TODO persist and also periodically prune pending hashes.
        return i.payment_request

    def pay_invoice(self, bolt11):
        logging.info("paying invoice: %s" % bolt11)
        r = self.lnd_client.pay_invoice(bolt11)
        print(r)
        logging.info("paid?: %s" % r)
        logging.info("route: %s" % r.payment_route)
        return r.payment_preimage.hex(), r.payment_route.total_amt_msat

    ###########################################################################

    def preimage2ph(self, preimage):
        return hashlib.sha256(preimage).hexdigest()

    def check_for_paid(self):
        # TODO - this polling sucks, figure out how to subscribe to grpc for
        # notifications.
        for p in list(self.pending_payment_hashes):
            l = self.lnd_client.lookup_invoice(r_hash_str=p)
            if l.state == 1:
                preimage = l.r_preimage.hex()
                msats = l.amt_paid
                print("preimage: %s msats %s" % (preimage, msats))
                payment_hash = self.preimage2ph(bytes.fromhex(preimage))
                self.pending_payment_hashes.remove(payment_hash)
                reactor.callFromThread(self._recv_paid, preimage, msats)

        reactor.callLater(0.25, self.check_for_paid)

# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid

from base64 import b64encode

from twisted.internet import reactor

from moneysocket.lightning.lightning import Lightning

class CLightning(Lightning):
    def __init__(self, plugin):
        super().__init__()
        self.plugin = plugin
        self.plugin.add_subscription("invoice_payment",
                                     self.handle_invoice_payment)

    def handle_invoice_payment(self, *args, **kwargs):
        logging.debug("kwargs: %s" % str(kwargs))
        msats = int(str(kwargs['invoice_payment']['msat'])[:-4])
        preimage = kwargs['invoice_payment']['preimage']
        logging.info("recvd payment: msats: %s  preimage: %s" % (
            msats, preimage))
        reactor.callFromThread(self._recv_paid, preimage, msats)

    def _gen_new_label(self):
        label_bytes = uuid.uuid4().bytes
        label_str = b64encode(label_bytes).decode('utf8')
        return label_str

    def get_invoice(self, msat_amount):
        logging.info("getting invoice: %smsats" % msat_amount)
        label = self._gen_new_label()
        i = self.plugin.rpc.invoice(msat_amount, label, "")
        logging.info("got: %s" % i)
        # TODO persist and also periodically prune pending hashes.
        return i['bolt11']

    def pay_invoice(self, bolt11):
        logging.info("paying invoice: %s" % bolt11)
        r = self.plugin.rpc.pay(bolt11)
        logging.info("paid?: %s" % r)
        # TODO catch failure and report it
        return r['payment_preimage'], r['msatoshi_sent']

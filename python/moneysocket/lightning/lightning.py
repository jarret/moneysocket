# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys



class Lightning(object):
    """ class providing interface to a 'real' lightning wallet/node """
    def __init__(self):
        self.paid_recv_cb = None

    ###########################################################################

    def register_paid_recv_cb(self, paid_recv_cb):
        self.paid_recv_cb = paid_recv_cb

    def get_invoice(self, msat_amount):
        sys.exit("implement in subclass")

    def pay_invoice(self, bolt11):
        sys.exit("implement in subclass")

    ###########################################################################

    def _recv_paid(self, preimage, msats):
        self.paid_recv_cb(preimage, msats)

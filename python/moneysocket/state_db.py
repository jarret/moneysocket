# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import json
import hashlib

from moneysocket.bolt11 import Bolt11


EMPTY_DB = {'pending': {},
            'msat_balance': 1234567,
           }

class StateDb(object):
    def __init__(self, lightning_node, state_filename):
        self.filename = os.path.abspath(state_filename)
        self.make_exist(self.filename)
        self.db = self.read_json(self.filename)
        self.lightning_node = lightning_node
        self.lightning_node.log("starting state db: %s" % self.db)

    ###########################################################################

    def make_exist(self, filename):
        if os.path.exists(filename):
            return
        dir_path = os.path.dirname(filename)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        self.write_json(filename, EMPTY_DB)

    def write_file(self, path, content):
        f = open(path, 'w')
        f.write(content)
        f.close()

    def write_json(self, path, info, quick=True):
        content = (json.dumps(info) if quick else
                   json.dumps(info, indent=1, sort_keys=True))
        self.write_file(path, content)

    def read_json(self, path):
        f = open(path, 'r')
        c = f.read()
        info = json.loads(c)
        f.close()
        return info

    def persist(self):
        self.write_json(self.filename, self.db)


    ###########################################################################

    def iter_pending_payment_hashes(self):
        for attrs in self.db['pending'].values():
            yield attrs['payment_hash']

    def get_pending_payment_hashes(self):
        return list(self.iter_pending_payment_hashes())

    ###########################################################################

    def get_balance(self):
        return self.db['msat_balance']

    def add_pending(self, bolt11):
        d = Bolt11.to_dict(bolt11)
        payment_hash = d['payment_hash']
        amount = d['msatoshi'] if 'msatoshi' in d.keys() else 0
        self.db['pending'][bolt11] = {'payment_hash': payment_hash,
                                      'amount':       amount}
        self.persist()


    def add_paid(self, msat_paid):
        self.db['msat_balance'] -= msat_paid
        self.persist()

    def add_preimage(self, preimage):
        payment_hash = hashlib.sha256(bytes.fromhex(preimage)).hexdigest()
        #print("preimage: %s payment hash: %s" % (preimage, payment_hash))
        for bolt11, attrs in self.db['pending'].items():
            if attrs['payment_hash'] == payment_hash:
                self.db['msat_balance'] += attrs['amount']
                del self.db['pending'][bolt11]
                self.persist()
                return

#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import json
import logging



EMPTY_DB = {'wallets':  {},
            'services': {}}


class PersistenceDb(object):
    def __init__(self, persist_filename):
        self.filename = os.path.abspath(persist_filename)
        self.make_exist(self.filename)
        logging.info("using persitence db: %s" % self.filename)
        self.db = self.read_json(self.filename)

    ###########################################################################

    def make_exist(self, filename):
        if os.path.exists(filename):
            return
        logging.info("initializing new persitence db: %s" % self.filename)
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

    def add_wallet(self, wallet_name, msatoshis):
        self.db['wallets'][wallet_name] = {'msatoshis':       msatoshis,
                                           'pending':         {},
                                           'listen_beacons':  [],
                                           'connect_beacons': []}
        self.persist()

    def remove_wallet(self, wallet_name):
        del self.db['wallets'][wallet_name]
        self.persist()

    def add_wallet_listen_beacon(self, wallet_name, listen_beacon):
        self.db['wallets'][wallet_name]['listen_beacons'].append(listen_beacon)
        self.persist()

    def add_wallet_connect_beacon(self, wallet_name, connect_beacon):
        self.db['wallets'][wallet_name]['connect_beacons'].append(
            connect_beacon)
        self.persist()

    def clear_wallet_beacons(self, wallet_name):
        self.db['wallets'][wallet_name]['listen_beacons'] = []
        self.db['wallets'][wallet_name]['connect_beacons'] = []
        self.persist()

    def decrement_msatoshis(self, wallet_name, msatoshi_delta):
        self.db['wallets'][wallet_name]['msatoshis'] -= msatoshi_delta
        self.persist()

    def increment_msatoshis(self, wallet_name, msatoshi_delta):
        self.db['wallets'][wallet_name]['msatoshis'] += msatoshi_delta
        self.persist()

    ###########################################################################

    # TODO add/remove pending

    ###########################################################################

    def add_service(self, service_name):
        self.db['services'][service_name] = {'listen_beacons':  [],
                                             'connect_beacons': []}
        self.persist()

    def remove_service(self, service_name):
        del self.db['services'][service_name]
        self.persist()

    def clear_service_beacons(self, service_name):
        self.db['services'][service_name]['listen_beacons'] = []
        self.db['services'][service_name]['connect_beacons'] = []
        self.persist()

    def add_service_listen_beacon(self, service_name, listen_beacon):
        self.db['services'][service_name]['listen_beacons'].append(
            listen_beacon)
        self.persist()

    def add_service_connect_beacon(self, service_name, connect_beacon):
        self.db['services'][service_name]['connect_beacons'].append(
            connect_beacon)
        self.persist()


    ###########################################################################

    def iter_wallets(self):
        for name, record in self.db['wallets'].items():
            msats = record['msatoshis']
            listens = record['listen_beacons']
            connects = record['connect_beacons']
            yield name, msats, listens, connects

    def iter_services(self):
        for name, record in self.db['services'].items():
            listens = record['listen_beacons']
            connects = record['connect_beacons']
            yield name, listens, connects

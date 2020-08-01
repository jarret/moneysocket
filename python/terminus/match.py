# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from moneysocket.beacon.beacon import MoneysocketBeacon

class Match(object):
    def __init__(self):
        # TODO more than one beacon per wallet?
        self.wallets = {}
        self.wallets_by_beacon = {}
        self.beacons_by_wallet = {}
        self.beacons_by_rid = {}
        self.rids_by_beacon = {}

    def _derive_rid(self, beacon_str):
        b, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert not err, "unexpected err: %s" % err
        return b.shared_seed.derive_rendezvous_id().hex()

    def assoc_wallet(self, wallet, beacon_str):
        assert wallet.name not in self.wallets, "double-added wallet/"
        self.wallets[wallet.name] = wallet
        self.wallets_by_beacon[beacon_str] = wallet.name
        self.beacons_by_wallet[wallet.name] = beacon_str
        rid = self._derive_rid(beacon_str)
        self.beacons_by_rid[rid] = beacon_str
        self.rids_by_beacon[beacon_str] = rid

    def disassoc_wallet(self, wallet_name):
        beacon_str = self.beacons_by_wallet[wallet_name]
        rid = self.rids_by_beacon[beacon_str]
        del self.wallets[wallet_name]
        del self.wallets_by_beacon[beacon_str]
        del self.beacons_by_wallet[wallet_name]
        del self.beacons_by_rid[rid]
        del self.rids_by_beacon[beacon_str]

    def get_wallet(self, beacon_str):
        return self.wallets_by_beacon[beacon_str]

    def get_beacon(self, wallet_name):
        return self.beacons_by_wallet[wallet_name]

    def get_rid(self, wallet_name):
        beacon_str = self.get_beacon(wallet_name)
        return self.rids_by_beacon[beacon_str]

    def rid_is_known(self, rid):
        return rid in self.beacons_by_rid

    def get_wallet_from_rid(self, rid):
        beacon_str = self.beacons_by_rid[rid]
        wallet_name = self.wallets_by_beacon[beacon_str]
        return self.wallets[wallet_name]

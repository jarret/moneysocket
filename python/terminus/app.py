# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import argparse
from configparser import ConfigParser

from twisted.internet.task import LoopingCall

from moneysocket.socket.websocket import WebsocketInterconnect
from moneysocket.core.wallet import Wallet
from moneysocket.persistence.db import PersistenceDb

from terminus.telnet import TerminusTelnetInterface

from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.location.websocket import WebsocketLocation



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
        return b.shared_seed.derive_rendezvous_id()

    def add_wallet(self, wallet, beacon_str):
        assert wallet.name not in self.wallets, "double-added wallet/"
        self.wallets[wallet.name] = wallet
        self.wallets_by_beacon[beacon_str] = wallet.name
        self.beacons_by_wallet[wallet.name] = beacon_str
        rid = self._derive_rid(beacon_str)
        self.beacons_by_rid[rid] = beacon_str
        self.rids_by_beacon[beacon_str] = rid

    def remove_wallet(self, wallet_name):
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



class Terminus(object):
    def __init__(self, config, lightning):
        self.config = config
        self.lightning = lightning
        self.db = PersistenceDb(self.config['App']['WalletPersistFile'])

        self.match = Match()

        self.wallets = {}

        #self.listen_order = {}

        self.is_listening = {}
        self.is_connecting = {}
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        TerminusTelnetInterface.APP = self

    def set_telnet_interface(self, telnet_interface):
        self.telnet_interface = telnet_interface

    ###########################################################################

    def get_listen_url(self):
        if self.config['Listen']['UseTLS'] == "True":
            url = "wss://%s:%s" % (
                self.config['Listen']['BindHost'],
                self.config['Listen']['BindPort'])
            return url
        elif self.config['Listen']['UseTLS'] == "False":
            url = "ws://%s:%s" % (
                self.config['Listen']['BindHost'],
                self.config['Listen']['BindPort'])
            return url
        else:
            logging.error("unknown setting: %s" %
                          self.config['Listen']['UseTLS'])
            return ''


    ##########################################################################

    def wallet_recv_cb(self, socket, msg):
        logging.info("got msg: %s" % msg.to_json())

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        if isinstance(cb_param, Wallet):
            # outgoing connection
            wallet = cb_param
            socket.register_recv_cb(self.wallet_recv_cb)
            wallet.add_socket(socket)
        else:
            # incoming connection
            assert isinstance(cb_param, str)
            listen_beacon = cb_param
            wallet = self.match.get_wallet(listen_beacon)

            #if listen_ws_url not in self.listen_order:
            #    logging.info("no wallet to connect new socket to")
            #    socket.initiate_close()
            #    return
            #if len(self.listen_order[listen_ws_url]) == 0:
            #    logging.info("no wallet or service to connect new socket to")
            #    socket.close()
            #    return
            #wallet_name = self.listen_order[listen_ws_url].pop(0)
            socket.register_recv_cb(self.wallet_recv_cb)
            wallet.add_socket(socket)

    def socket_close_cb(self, socket):
        logging.info("app got socket closed: %s" % socket)
        for wallet in self.wallets.values():
            if wallet.has_this_socket(socket):
                wallet.remove_socket()
                #if wallet.name in self.is_listening.keys():
                #    listen_ws_url = self.is_listening[wallet.name]
                #    self.listen_order[listen_ws_url].append(wallet.name)

    ##########################################################################

    def _iter_ls_lines(self):
        yield "LN WALLETs:"
        if len(self.wallets) == 0:
            yield "\t(none)"
        for wallet in self.wallets.values():
            yield "%s" % (wallet)

    def ls(self, args):
        return "\n".join(self._iter_ls_lines())

    ##########################################################################

    def gen_wallet_name(self):
        existing = set(self.wallets.keys())
        i = 0
        def wallet_name(n):
            return "wallet-%d" % n
        while wallet_name(i) in existing:
            i += 1
        return wallet_name(i)

    def newwallet(self, args):
        if args.msatoshis <= 0:
            return "*** invalid msatoshis value"

        wallet_name = self.gen_wallet_name()
        wallet = Wallet(wallet_name, args.msatoshis)
        self.wallets[wallet_name] = wallet
        self.db.add_wallet(wallet_name, args.msatoshis)
        return "added wallet: %s  msatoshis: %.03f" % (wallet_name,
                                                       wallet.msatoshis)

    ##########################################################################

    def rmwallet(self, args):
        wallets = set(self.wallets.keys())
        if args.wallet not in self.wallets.keys():
            return "*** unknown wallet: %s" % args.wallet
        name = args.wallet
        wallet = self.wallets[name]
        if wallet.has_socket():
            return "*** %s still has socket" % name

        if wallet.has_connection_attempt():
            return "*** %s still has connection_attempt" % name

        self.db.remove_wallet(name)
        del self.wallets[name]
        return "removed: %s" % name

    ##########################################################################

    def connect(self, args, persist=True):
        if args.wallet not in self.wallets.keys():
            return "*** unknown wallet: %s" % args.wallet

        wallet_name = args.wallet
        beacon_str = args.beacon

        wallet = self.wallets[wallet_name]
        if persist:
            self.db.add_wallet_connect_beacon(wallet_name, beacon_str)

        beacon = MoneysocketBeacon.from_bech32_str(beacon_str)
        location = beacon.locations[0]
        assert location.to_dict()['type'] == "WebSocket", "can't connect beacon"
        ws_url = str(location)

        self.match.add_wallet(wallet, beacon)

        connection_attempt = self.interconnect.connect(ws_url,
                                                       cb_param=wallet)
        wallet.add_connection_attempt(connection_attempt)
        wallet.add_attribute("connect", beacon_str)
        self.is_connecting[wallet_name] = wallet
        return "connected: %s to %s" % (wallet_name, ws_url)


    ##########################################################################

    def listen(self, args, persist=True):
        logging.info("listen")
        if args.wallet not in self.wallets.keys():
            return "*** unknown wallet: %s" % args.wallet

        wallet_name = args.wallet
        beacon_str = args.beacon

        wallet = self.wallets[wallet_name]
        if persist:
            self.db.add_wallet_listen_beacon(wallet_name, beacon_str)

        #beacon = MoneysocketBeacon.from_bech32_str(args.beacon)
        listen_url = self.get_listen_url()
        self.interconnect.listen(listen_url, cb_param=beacon_str)

        self.match.add_wallet(wallet, beacon_str)
        wallet.add_attribute("listen", beacon_str)

        return "listening: %s to %s" % (wallet_name, beacon_str)

    ##########################################################################

    def clearconnection(self, args):
        if args.wallet not in self.wallets.keys():
            return "*** unknown role: %s" % args.wallet
        name = args.wallet

        #new_listen_orders = {}
        #for listen_ws_url, listen_orders in self.listen_order.items():
        #    new_listen_orders[listen_ws_url] = [o for o in listen_orders if
        #                                        o != name]
        #self.listen_order = new_listen_orders

        #if name in self.is_listening.keys():
        #    listen_ws_url = self.is_listening[name]
        #    del self.is_listening[name]
        #    n_listening_same = sum(1 for u in self.is_listening.values()
        #                           if u == listen_ws_url)
        #    if n_listening_same == 0:
        #        self.interconnect.stop_listening(listen_ws_url)
        #if name in self.is_connecting.keys():
        #    del self.is_connecting[name]

        wallet = self.wallets[name]
        self.db.clear_wallet_beacons(name)

        #self.match.remove_wallet(wallet.name)

        wallet.remove_attribute("listen")
        wallet.remove_attribute("connect")
        if wallet.has_socket():
            socket = wallet.get_socket()
            socket.close()
        wallet.remove_socket()

        logging.info("clearconnection")
        return "cleared connections for %s" % (args.wallet)

    ##########################################################################

    def help(self, args):
        if args.cmd not in self.telnet_interface.subparsers.keys():
            return "*** unknown cmd: %s" % args.cmd
        return self.telnet_interface.subparsers[args.cmd].format_usage()

    ##########################################################################

    def load_persisted(self):
        for name, msats, listens, connects in self.db.iter_wallets():
            wallet = Wallet(name, msats)
            self.wallets[name] = wallet
            for beacon_str in connects:
                args = argparse.Namespace()
                args.beacon = beacon_str
                args.wallet = name

                logging.info("from persist, connecting: %s to %s" % (
                    name, beacon))
                self.connect(args, persist=False)

                #connection_attempt = self.interconnect.connect(connect,
                #    cb_param=wallet)
                #wallet.add_connection_attempt(connection_attempt)
                #wallet.add_attribute("connect", connect)
                #self.is_connecting[wallet.name] = connect
            for beacon_str in listens:
                logging.info("from persist, listening: %s on %s" % (
                    name, beacon_str))
                args = argparse.Namespace()
                args.beacon = beacon_str
                args.wallet = name
                self.listen(args, persist=False)

                #if listen not in self.listen_order.keys():
                #    self.listen_order[listen] = []
                #    self.listen_order[listen].append(name)
                #else:
                #    self.listen_order[listen].append(name)
                #self.interconnect.listen(listen, cb_param=listen)
                #self.is_listening[name] = listen
                #wallet.add_attribute("listen", listen)

    def try_connect(self):
        #print("try connect")
        #logging.info("try connect stub")
        pass

    ##########################################################################

    def run_app(self):
        print("run app")
        TerminusTelnetInterface.run_interface(self.config)
        self.load_persisted()
        self.connect_loop = LoopingCall(self.try_connect)
        self.connect_loop.start(10, now=False)

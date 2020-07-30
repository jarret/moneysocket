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

from moneysocket.core.message.notification.error import NotifyError

from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.location.websocket import WebsocketLocation

from terminus.telnet import TerminusTelnetInterface
from terminus.match import Match


class Terminus(object):
    def __init__(self, config, lightning):
        self.config = config
        self.lightning = lightning
        self.db = PersistenceDb(self.config['App']['WalletPersistFile'])

        self.match = Match()
        self.wallets = {}
        self.is_listening = set()
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

    def add_connect_beacon_attributes(self, wallet, beacon_str):
        b, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert err == None
        wallet.add_attribute("connect", str(b.locations[0]))
        wallet.add_attribute("shared_seed", str(b.shared_seed))
        wallet.add_attribute("rendezvous_id",
                             b.shared_seed.derive_rendezvous_id().hex())
        wallet.add_attribute("beacon", beacon_str)

    def remove_connect_attributes(self, wallet):
        wallet.remove_attribute("connect")
        wallet.remove_attribute("shared_seed")
        wallet.remove_attribute("rendezvous_id")
        wallet.remove_attribute("beacon")

    def add_listen_beacon_attributes(self, wallet, beacon_str):
        b, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert err == None
        wallet.add_attribute("listen", str(b.locations[0]))
        wallet.add_attribute("shared_seed", str(b.shared_seed))
        wallet.add_attribute("rendezvous_id",
                             b.shared_seed.derive_rendezvous_id().hex())
        wallet.add_attribute("beacon", beacon_str)

    def remove_listen_attributes(self, wallet):
        wallet.remove_attribute("listen")
        wallet.remove_attribute("shared_seed")
        wallet.remove_attribute("rendezvous_id")
        wallet.remove_attribute("beacon")


    ##########################################################################

    def is_request_rendezvous(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] == "REQUEST_RENDEZVOUS"

    def start_rendezvous(self, socket, beacon_str):
        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert not err, "unexpected err: %s" % err

        wallet_name = self.match.get_wallet(beacon_str)
        wallet = self.wallets[wallet_name]
        rid = beacon.shared_seed.derive_rendezvous_id()

        socket.register_shared_seed(beacon.shared_seed)
        wallet.add_socket(socket)
        wallet.start_rendezvous(rid)

    def handle_request_rendezvous(self, socket, msg):
        rid = msg['rendezvous_id']
        if not self.match.rid_is_known(rid):
            req_ref_uuid = msg['request_reference_uuid']
            socket.write(NotifyError("unknown rendezvous_id",
                                     request_reference_uuid=req_ref_uuid))
            return

        # match rendezvous to wallet role and register socket
        wallet = self.match.get_wallet_from_rid(rid)
        beacon_str = self.match.get_beacon(wallet.name)
        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert not err, "unexpected err: %s" % err
        assert rid == beacon.derive_rendezvous_id(), "unexpected rid"
        socket.register_shared_seed(beacon.shared_seed)
        wallet.add_socket(socket)

        # pass message for wallet role to proceed
        wallet.msg_recv_cb(socket, msg)

    ##########################################################################

    def recv_cb(self, socket, msg):
        logging.info("got msg: %s" % msg.to_json())

        if not self.is_request_rendezvous(msg):
            socket.write(NotifyError("unknown message",
                                     request_reference_uuid=None))
            socket.close()
            return
        self.handle_request_rendezvous(socket, msg)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        if cb_param is not None:
            beacon_str = cb_param
            self.start_rendezvous(socket, beacon_str)
        else:
            logging.info("waiting until other side requests rendezvous")
            socket.register_recv_cb(self.recv_cb)

    def socket_close_cb(self, socket):
        logging.info("app got socket closed: %s" % socket)
        for wallet in self.wallets.values():
            if wallet.has_this_socket(socket):
                wallet.remove_socket()

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

        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        if err:
            return "*** could not decode beacon: %s" % err
        location = beacon.locations[0]
        assert location.to_dict()['type'] == "WebSocket", "can't connect beacon"
        ws_url = str(location)

        self.match.assoc_wallet(wallet, beacon_str)
        connection_attempt = self.interconnect.connect(ws_url,
                                                       cb_param=beacon_str)
        wallet.add_connection_attempt(connection_attempt)
        self.add_connect_beacon_attributes(wallet, beacon_str)
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

        listen_url = self.get_listen_url()
        if len(self.is_listening) == 0:
            self.interconnect.listen(listen_url, cb_param=None)
        self.is_listening.add(wallet_name)

        self.match.assoc_wallet(wallet, beacon_str)
        self.add_listen_beacon_attributes(wallet, beacon_str)

        return "listening: %s to %s" % (wallet_name, beacon_str)

    ##########################################################################

    def clearconnection(self, args):
        if args.wallet not in self.wallets.keys():
            return "*** unknown role: %s" % args.wallet
        wallet_name = args.wallet

        if wallet_name in self.is_connecting.keys():
            del self.is_connecting[wallet_name]

        if wallet_name in self.is_listening:
            self.is_listening.remove(wallet_name)

        if len(self.is_listening) == 0:
            self.interconnect.stop_listening(self.get_listen_url())

        wallet = self.wallets[wallet_name]
        self.db.clear_wallet_beacons(wallet_name)
        self.match.disassoc_wallet(wallet_name)

        self.remove_listen_attributes(wallet)
        self.remove_connect_attributes(wallet)
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
                logging.info("from persist, connecting: %s to %s" % (name,
                    beacon_str))
                self.connect(args, persist=False)

            for beacon_str in listens:
                logging.info("from persist, listening: %s on %s" % (
                    name, beacon_str))
                args = argparse.Namespace()
                args.beacon = beacon_str
                args.wallet = name
                self.listen(args, persist=False)


    def try_connect(self):
        # TODO retry loop on is_connecting
        pass

    ##########################################################################

    def run_app(self):
        TerminusTelnetInterface.run_interface(self.config)
        self.load_persisted()
        self.connect_loop = LoopingCall(self.try_connect)
        self.connect_loop.start(10, now=False)

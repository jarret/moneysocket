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
from moneysocket.core.message.notification.provider import NotifyProvider
from moneysocket.core.message.notification.invoice import NotifyInvoice
from moneysocket.core.message.notification.preimage import NotifyPreimage

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

        self.lightning.register_paid_recv_cb(self.node_received_payment_cb)

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


    ###########################################################################

    def node_received_payment_cb(self, preimage, msats):
        logging.info("node received payment: %s %s" % (preimage, msats))
        for wallet in self.wallets.values():
            if wallet.is_pending(preimage):
                msg1 = NotifyPreimage(preimage, ext=None,
                                      request_reference_uuid=None)
                wallet.increment_msats(msats)
                self.db.increment_msatoshis(wallet.name, msats)
                msg2 = wallet.get_notify_msg()
                wallet.socket.write(msg1)
                wallet.socket.write(msg2)
                return

    ##########################################################################

    def request_provider(self, msg, role):
        logging.info("requested provider")
        # No 'PROVIDER_BECOMING_READY' phase for terminus
        return role.get_notify_msg(request_reference_uuid=msg['request_uuid'])

    def request_invoice(self, msg, role):
        logging.info("requested invoice")
        msats = msg['msats']
        req_ref_uuid = msg['request_uuid']
        bolt11 = self.lightning.get_invoice(msats)
        role.add_pending(bolt11)
        # TODO persist pending
        # TODO should we persist request uuid for NOTIFY_PREIMAGE?
        return NotifyInvoice(bolt11, request_reference_uuid=req_ref_uuid)

    def request_pay(self, msg, role):
        logging.info("requested pay")
        bolt11 = msg['bolt11']
        req_ref_uuid = msg['request_uuid']
        preimage, msats = self.lightning.pay_invoice(bolt11)
        msg1 = NotifyPreimage(preimage, ext=None)
        role.decrement_msats(msats)
        self.db.decrement_msatoshis(role.name, msats)
        msg2 = role.get_notify_msg()
        return [msg1, msg2]

    def register_hooks(self, role):
        hooks = {"REQUEST_PROVIDER": self.request_provider,
                 "REQUEST_INVOICE":  self.request_invoice,
                 "REQUEST_PAY":      self.request_pay,
                }
        role.register_app_hooks(hooks)

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
        self.register_hooks(wallet)
        wallet.start_rendezvous(rid)

    def handle_request_rendezvous(self, socket, msg):
        rid = msg['rendezvous_id']
        if not self.match.rid_is_known(rid):
            req_ref_uuid = msg['request_uuid']
            socket.write(NotifyError("unknown rendezvous_id",
                                     request_reference_uuid=req_ref_uuid))
            return

        # match rendezvous to wallet role and register socket
        wallet = self.match.get_wallet_from_rid(rid)
        beacon_str = self.match.get_beacon(wallet.name)
        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        assert not err, "unexpected err: %s" % err
        brid = beacon.shared_seed.derive_rendezvous_id().hex()
        assert rid == brid, "unexpected rid"
        socket.register_shared_seed(beacon.shared_seed)
        wallet.add_socket(socket)
        self.register_hooks(wallet)
        # pass message for wallet role to proceed
        wallet.msg_recv_cb(socket, msg)

    ##########################################################################

    def setup_rendezvous_recv_cb(self, socket, msg):
        # only for setting up rendezvous, then the socket cb will be
        # re-registered
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
            socket.register_recv_cb(self.setup_rendezvous_recv_cb)

    def socket_close_cb(self, socket):
        logging.info("app got socket closed: %s" % socket)
        for wallet in self.wallets.values():
            if wallet.has_this_socket(socket):
                wallet.remove_socket()
                wallet.set_state("INIT")

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

    def create(self, args):
        if args.msatoshis.endswith("msat"):
            try:
                msats = int(args.msatoshis[:-4])
            except:
                return "*** could not parse msat value"
        elif args.msatoshis.endswith("msats"):
            try:
                msats = int(args.msatoshis[:-5])
            except:
                return "*** could not parse msat value"
        elif args.msatoshis.endswith("sat"):
            try:
                msats = 1000 * int(args.msatoshis[:-3])
            except:
                return "*** could not parse msat value"
        elif args.msatoshis.endswith("sats"):
            try:
                msats = 1000 * int(args.msatoshis[:-4])
            except:
                return "*** could not parse msat value"
        else:
            try:
                msats = 1000 * int(args.msatoshis)
            except:
                return "*** could not parse msat value"
        if msats <= 0:
            return "*** invalid msatoshis value"

        wallet_name = self.gen_wallet_name()
        wallet = Wallet(wallet_name, msats)
        self.wallets[wallet_name] = wallet
        self.db.add_wallet(wallet_name, msats)
        return "created wallet: %s  msatoshis: %d" % (wallet_name,
                                                      wallet.msatoshis)

    ##########################################################################

    def rm(self, args):
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
        self.match.assoc_wallet(wallet, beacon_str)
        connection_attempt = self.interconnect.connect(location,
                                                       cb_param=beacon_str)
        wallet.add_connection_attempt(connection_attempt)
        self.add_connect_beacon_attributes(wallet, beacon_str)
        self.is_connecting[wallet_name] = beacon_str
        return "connected: %s to %s" % (wallet_name, str(location))


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
        for wallet_name, beacon_str in self.is_connecting.items():
            wallet = self.wallets[wallet_name]
            if not wallet.has_socket() and not wallet.is_connecting():
                logging.info("trying to connect %s to %s" % (wallet_name,
                                                             beacon_str))

                beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
                location = beacon.locations[0]
                connection_attempt = self.interconnect.connect(
                    location, cb_param=beacon_str)
                wallet.add_connection_attempt(connection_attempt)

    ##########################################################################

    def run_app(self):
        TerminusTelnetInterface.run_interface(self.config)
        self.load_persisted()
        self.connect_loop = LoopingCall(self.try_connect)
        self.connect_loop.start(5, now=False)

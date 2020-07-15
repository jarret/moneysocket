# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
from configparser import ConfigParser

from twisted.internet.task import LoopingCall

from moneysocket.socket.websocket import WebsocketInterconnect
from moneysocket.core.wallet import Wallet
from moneysocket.persistence.db import PersistenceDb

from terminus.telnet import TerminusTelnetInterface

class Terminus(object):
    def __init__(self, config, lightning):
        self.config = config
        self.lightning = lightning
        self.db = PersistenceDb(self.config['App']['WalletPersistFile'])
        self.wallets = {}
        self.listen_order = {}
        self.is_listening = {}
        self.is_connecting = {}
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        TerminusTelnetInterface.APP = self

    def set_telnet_interface(self, telnet_interface):
        self.telnet_interface = telnet_interface

    ##########################################################################

    def wallet_recv_cb(self, socket, msg_dict):
        logging.info("got msg: %s" % msg_dict)
        if msg_dict['request_type'] == "PING":
            socket.write({'request_type': "PONG"})
        elif msg_dict['request_type'] == "PONG":
            socket.write({'request_type': "PING"})
        else:
            logging.error("unknown message: %s" % msg_dict)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        if isinstance(cb_param, Wallet):
            wallet = cb_param
            socket.register_recv_cb(self.wallet_recv_cb)
            wallet.add_socket(socket)
        else:
            assert isinstance(cb_param, str)
            listen_ws_url = cb_param

            if listen_ws_url not in self.listen_order:
                logging.info("no wallet to connect new socket to")
                socket.initiate_close()
                return
            if len(self.listen_order[listen_ws_url]) == 0:
                logging.info("no wallet or service to connect new socket to")
                socket.close()
                return
            wallet_name = self.listen_order[listen_ws_url].pop(0)
            wallet = self.wallets[wallet_name]
            socket.register_recv_cb(self.wallet_recv_cb)
            wallet.add_socket(socket)

    def socket_close_cb(self, socket):
        logging.info("app got socket closed: %s" % socket)
        for wallet in self.wallets.values():
            if wallet.has_this_socket(socket):
                wallet.remove_socket()
                if wallet.name in self.is_listening.keys():
                    listen_ws_url = self.is_listening[wallet.name]
                    self.listen_order[listen_ws_url].append(wallet.name)

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

    def connect(self, args):
        if args.wallet not in self.wallets.keys():
            return "*** unknown wallet: %s" % args.wallet

        wallet = self.wallets[args.wallet]
        self.db.add_wallet_connect_connection(args.wallet,
                                              args.connect_ws_url)
        connection_attempt = self.interconnect.connect(args.connect_ws_url,
                                                       cb_param=wallet)
        wallet.add_connection_attempt(connection_attempt)
        wallet.add_attribute("connect", args.connect_ws_url)
        self.is_connecting[wallet.name] = wallet
        return "connected: %s to %s" % (args.wallet, args.connect_ws_url)


    ##########################################################################

    def listen(self, args):
        logging.info("listen")
        if args.wallet not in self.wallets.keys():
            return "*** unknown wallet: %s" % args.wallet

        self.db.add_wallet_listen_connection(args.wallet, args.listen_ws_url)

        if args.listen_ws_url not in self.listen_order.keys():
            self.listen_order[args.listen_ws_url] = []
        self.listen_order[args.listen_ws_url].append(args.wallet)
        self.interconnect.listen(args.listen_ws_url,
                                 cb_param=args.listen_ws_url)
        self.wallets[args.wallet].add_attribute("listen", args.listen_ws_url)
        return "listening: %s to %s" % (args.wallet, args.listen_ws_url)

    ##########################################################################

    def clearconnection(self, args):
        if args.wallet not in self.wallets.keys():
            return "*** unknown role: %s" % args.wallet
        name = args.wallet
        new_listen_orders = {}
        for listen_ws_url, listen_orders in self.listen_order.items():
            new_listen_orders[listen_ws_url] = [o for o in listen_orders if
                                                o != name]
        self.listen_order = new_listen_orders

        if name in self.is_listening.keys():
            listen_ws_url = self.is_listening[name]
            del self.is_listening[name]
            n_listening_same = sum(1 for u in self.is_listening.values()
                                   if u == listen_ws_url)
            if n_listening_same == 0:
                self.interconnect.stop_listening(listen_ws_url)
        if name in self.is_connecting.keys():
            del self.is_connecting[name]

        wallet = self.wallets[name]
        self.db.clear_wallet_connections(name)

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
            for connect in connects:
                logging.info("from persist, connecting: %s to %s" % (
                    name, connect))
                connection_attempt = self.interconnect.connect(connect,
                    cb_param=wallet)
                wallet.add_connection_attempt(connection_attempt)
                wallet.add_attribute("connect", connect)
                self.is_connecting[wallet.name] = connect
            for listen in listens:
                logging.info("from persist, listening: %s on %s" % (
                    name, listen))
                if listen not in self.listen_order.keys():
                    self.listen_order[listen] = []
                    self.listen_order[listen].append(name)
                else:
                    self.listen_order[listen].append(name)
                self.interconnect.listen(listen, cb_param=listen)
                self.is_listening[name] = listen
                wallet.add_attribute("listen", listen)
            self.wallets[name] = wallet

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

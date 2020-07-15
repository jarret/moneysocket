# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from twisted.internet.task import LoopingCall

from moneysocket.socket.websocket import WebsocketInterconnect
from moneysocket.core.service import Service
from moneysocket.core.wallet import Wallet
from moneysocket.persistence.db import PersistenceDb

from junction.telnet import JunctionTelnetInterface

###############################################################################

class Junction(object):
    def __init__(self, config):
        self.config = config
        self.db = PersistenceDb(self.config['App']['WalletPersistFile'])
        self.services = {}
        self.wallets = {}
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        self.listen_order = {}
        self.is_listening = {}
        self.is_connecting = {}
        self.connect_loop = None
        JunctionTelnetInterface.APP = self

    def set_telnet_interface(self, telnet_interface):
        self.telnet_interface = telnet_interface

    ###########################################################################

    def wallet_recv_cb(self, socket, msg_dict):
        if msg_dict['request_type'] in {"PING", "PONG", "ERROR"}:
            services = []
            for service in self.services.values():
                if service.has_socket():
                    services.append(service)
            if len(services) == 0:
                socket.write({'request_type': "ERROR"})
            for service in services:
                logging.info("forwarding to service: %s" % service.name)
                fwd_socket = service.get_socket()
                logging.info("fwd socket: %s" % fwd_socket)
                fwd_socket.write(msg_dict)
        else:
            logging.error("unknown message: %s" % msg_dict)

    def service_recv_cb(self, socket, msg_dict):
        if msg_dict['request_type'] in {"PING", "PONG", "ERROR"}:
            wallets = []
            for wallet in self.wallets.values():
                if wallet.has_socket():
                    wallets.append(wallet)
            if len(wallets) == 0:
                socket.write({'request_type': "ERROR"})
            for wallet in wallets:
                logging.info("forwarding to wallet: %s" % wallet.name)
                fwd_socket = wallet.get_socket()
                logging.info("fwd socket: %s" % fwd_socket)
                fwd_socket.write(msg_dict)
        else:
            logging.error("unknown message: %s" % msg_dict)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        logging.info("app got socket: %s" % socket)
        if isinstance(cb_param, Wallet):
            wallet = cb_param
            socket.register_recv_cb(self.wallet_recv_cb)
            wallet.add_socket(socket)
        elif isinstance(cb_param, Service):
            service = cb_param
            socket.register_recv_cb(self.service_recv_cb)
            service.add_socket(socket)
        else:
            assert isinstance(cb_param, str)
            listen_ws_url = cb_param

            if listen_ws_url not in self.listen_order:
                logging.info("no wallet or service to connect new socket to")
                socket.initiate_close()
                return
            if len(self.listen_order[listen_ws_url]) == 0:
                logging.info("no wallet or service to connect new socket to")
                socket.close()
                return
            wallet_or_service_name = self.listen_order[listen_ws_url].pop(0)
            if wallet_or_service_name in self.services.keys():
                service = self.services[wallet_or_service_name]
                socket.register_recv_cb(self.service_recv_cb)
                service.add_socket(socket)
            elif wallet_or_service_name in self.wallets.keys():
                wallet = self.wallets[wallet_or_service_name]
                socket.register_recv_cb(self.wallet_recv_cb)
                wallet.add_socket(socket)


    def socket_close_cb(self, socket):
        logging.info("app got socket closed: %s" % socket)
        for service in self.services.values():
            if service.has_this_socket(socket):
                service.remove_socket()
                if service.name in self.is_listening.keys():
                    listen_ws_url = self.is_listening[service.name]
                    self.listen_order[listen_ws_url].append(service.name)
        for wallet in self.wallets.values():
            if wallet.has_this_socket(socket):
                wallet.remove_socket()
                if wallet.name in self.is_listening.keys():
                    listen_ws_url = self.is_listening[wallet.name]
                    self.listen_order[listen_ws_url].append(wallet.name)

    ###########################################################################

    def help(self, args):
        if args.cmd not in self.telnet_interface.subparsers.keys():
            return "*** unknown cmd: %s" % args.cmd
        return self.telnet_interface.subparsers[args.cmd].format_usage()

    ###########################################################################

    def _iter_ls_lines(self):
        yield "LN SERVICEs:"
        if len(self.services) == 0:
            yield "\t(none)"
        for service in self.services.values():
            yield "%s" % service
        yield "LN WALLETs:"
        if len(self.wallets) == 0:
            yield "\t(none)"
        for wallet in self.wallets.values():
            yield "%s" % (wallet)

    def ls(self, args):
        return "\n".join(self._iter_ls_lines())

    ###########################################################################

    def connect(self, args):
        services = set(self.services.keys())
        wallets = set(self.wallets.keys())
        if args.wallet_or_service not in services.union(wallets):
            return "*** unknown role: %s" % args.wallet_or_service

        if args.wallet_or_service in services:
            service_name = args.wallet_or_service
            service = self.services[service_name]
            self.db.add_service_connect_connection(service_name,
                                                   args.connect_ws_url)
            connection_attempt = self.interconnect.connect(args.connect_ws_url,
                                                           cb_param=service)
            service.add_connection_attempt(connection_attempt)
            service.add_attribute("connect", args.connect_ws_url)
            self.is_connecting[service.name] = args.connect_ws_url
        else:
            wallet_name = args.wallet_or_service
            wallet = self.wallets[wallet_name]
            self.db.add_wallet_connect_connection(wallet_name,
                                                  args.connect_ws_url)
            connection_attempt = self.interconnect.connect(args.connect_ws_url,
                                                           cb_param=wallet)
            wallet.add_connection_attempt(connection_attempt)
            wallet.add_attribute("connect", args.connect_ws_url)
            self.is_connecting[wallet.name] = args.connect_ws_url

        return "attempting to connect: %s" % args.connect_ws_url

    ###########################################################################


    def listen_wallet_or_service(self, listen_ws_url, wallet_or_service):
        if wallet_or_service in self.services.keys():
            service_name = wallet_or_service
            self.db.add_service_listen_connection(service_name, listen_ws_url)

            if listen_ws_url not in self.listen_order.keys():
                self.listen_order[listen_ws_url] = []
            self.listen_order[listen_ws_url].append(service_name)
            self.interconnect.listen(listen_ws_url, cb_param=listen_ws_url)
            self.services[service_name].add_attribute("listen", listen_ws_url)
        else:
            wallet_name = wallet_or_service
            self.db.add_wallet_listen_connection(wallet_name, listen_ws_url)

            if listen_ws_url not in self.listen_order.keys():
                self.listen_order[listen_ws_url] = []
            self.listen_order[listen_ws_url].append(wallet_name)
            self.interconnect.listen(listen_ws_url, cb_param=listen_ws_url)
            self.wallets[wallet_name].add_attribute("listen", listen_ws_url)

        self.is_listening[wallet_or_service] = listen_ws_url
        return "listening on: %s" % (listen_ws_url)

    def listen(self, args):
        services = set(self.services.keys())
        wallets = set(self.wallets.keys())
        for wallet_or_service in args.wallet_or_service:
            if wallet_or_service not in services.union(wallets):
                return "*** unknown role: %s" % wallet_or_service

        results = []
        for wallet_or_service in args.wallet_or_service:
            r = self.listen_wallet_or_service(args.listen_ws_url,
                                              wallet_or_service)
            results.append(r)
        return "\n".join(results)

    ###########################################################################

    def clearconnection(self, args):
        services = set(self.services.keys())
        wallets = set(self.wallets.keys())
        if args.wallet_or_service not in services.union(wallets):
            return "*** unknown role: %s" % args.wallet_or_service
        name = args.wallet_or_service

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

        if name in self.services.keys():
            role = self.services[name]
            self.db.clear_service_connections(name)
        else:
            role = self.wallets[name]
            self.db.clear_wallet_connections(name)

        role.remove_attribute("listen")
        role.remove_attribute("connect")
        if role.has_socket():
            socket = role.get_socket()
            socket.close()
        role.remove_socket()

        return "connection closed for : %s" % name

    ###########################################################################

    def rmrole(self, args):
        services = set(self.services.keys())
        wallets = set(self.wallets.keys())
        if args.wallet_or_service not in services.union(wallets):
            return "*** unknown role: %s" % args.wallet_or_service
        name = args.wallet_or_service

        if name in self.services.keys():
            role = self.services[name]
        else:
            role = self.wallets[name]
        if role.has_socket():
            return "*** %s still has socket" % name
        if role.has_connection_attempt():
            return "*** %s still has connection_attempt" % name

        if name in self.services.keys():
            self.db.remove_service(name)
            del self.services[name]
        else:
            self.db.remove_wallet(name)
            del self.wallets[name]

        return "removed: %s" % name

    ###########################################################################

    def gen_service_name(self):
        existing = set(self.services.keys())
        i = 0
        def service_name(n):
            return "service-%d" % n
        while service_name(i) in existing:
            i += 1
        return service_name(i)

    def newservice(self, args):
        service_name = self.gen_service_name()
        service = Service(service_name)
        self.services[service_name] = service
        self.db.add_service(service_name)
        return "added service: %s" % service_name

    ###########################################################################

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

    ###########################################################################

    def move(self, args):
        return "move"

    ###########################################################################

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

        for name, listens, connects in self.db.iter_services():
            service = Service(name)
            for connect in connects:
                logging.info("from persist, connecting: %s to %s" % (
                    name, connect))
                connection_attempt = self.interconnect.connect(connect,
                    cb_param=service)
                service.add_connection_attempt(connection_attempt)
                service.add_attribute("connect", connect)
                self.is_connecting[service.name] = connect
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
                service.add_attribute("listen", listen)
            self.services[name] = service


    ###########################################################################

    def try_connect(self):
        for name, connect_ws_url in self.is_connecting.items():
            if name in self.services.keys():
                service = self.services[name]
                if not service.has_socket() and not service.is_connecting():
                    logging.info("trying to connect %s to %s" % (
                        service.name, connect_ws_url))
                    connection_attempt = self.interconnect.connect(
                        connect_ws_url, cb_param=service)
                    service.add_connection_attempt(connection_attempt)
                    service.add_attribute("connect", connect_ws_url)
            elif name in self.wallets.keys():
                wallet = self.wallets[name]
                if not wallet.has_socket() and not wallet.is_connecting():
                    logging.info("trying to connect %s to %s" % (
                        wallet.name, connect_ws_url))
                    connection_attempt = self.interconnect.connect(
                        connect_ws_url, cb_param=wallet)
                    wallet.add_connection_attempt(connection_attempt)
                    wallet.add_attribute("connect", connect_ws_url)
            else:
                logging.error("unknown name? %s" % name)

    ###########################################################################

    def run_app(self):
        JunctionTelnetInterface.run_interface(self.config)
        self.load_persisted()
        self.connect_loop = LoopingCall(self.try_connect)
        self.connect_loop.start(10, now=False)

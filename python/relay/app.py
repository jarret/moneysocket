# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import logging
from configparser import ConfigParser
from OpenSSL import SSL

from moneysocket.socket.websocket import WebsocketInterconnect
from moneysocket.core.service import Service
from moneysocket.core.wallet import Wallet

class Relay(object):
    def __init__(self, config):
        self.config = config
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        self.service_listen_url = self.get_listen_url(self.config['Service'])
        self.service_tls_info = self.get_tls_info(self.config['Service'])
        self.wallet_listen_url = self.get_listen_url(self.config['Wallet'])
        self.wallet_tls_info = self.get_tls_info(self.config['Wallet'])
        self.service = None
        self.wallet = None

    ###########################################################################

    def get_listen_url(self, config_section):
        bind = config_section['ListenBind']
        port = int(config_section['ListenPort'])
        prefix = "wss" if config_section['UseTLS'] == "True" else "ws"
        return "%s://%s:%d" % (prefix, bind, port)

    def get_tls_info(self, config_section):
        if config_section['UseTLS'] != "True":
            return None
        tls_info = {'sslmethod': SSL.TLSv1_2_METHOD,
                    'cert_file': os.path.abspath(config_section['CertFile']),
                    'key_file':  os.path.abspath(config_section['CertKey'])}
        tls_info['cert_chain_file'] = (
            os.path.abspath(config_section['CertChainFile']) if
            config_section['SelfSignedCert'] == "True" else None)
        return tls_info

    ###########################################################################

    def wallet_recv_cb(self, socket, msg_dict):
        if msg_dict['request_type'] in {"PING", "PONG", "ERROR"}:
            if not self.service or not self.service.has_socket():
                socket.write({'request_type': "ERROR"})
                return
            fwd_socket = self.service.get_socket()
            fwd_socket.write(msg_dict)
        else:
            logging.error("unknown message: %s" % msg_dict)

    def service_recv_cb(self, socket, msg_dict):
        if msg_dict['request_type'] in {"PING", "PONG", "ERROR"}:
            if not self.wallet or not self.wallet.has_socket():
                socket.write({'request_type': "ERROR"})
                return
            fwd_socket = self.wallet.get_socket()
            fwd_socket.write(msg_dict)
        else:
            logging.error("unknown message: %s" % msg_dict)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        logging.info("got new socket: %s %s" % (socket, cb_param))
        if cb_param == "service":
            if self.service is not None:
                logging.error("got extra service socket, closing.")
                socket.initiate_close()
                return
            logging.info("creating Service")
            self.service = Service("relay-service")
            socket.register_recv_cb(self.service_recv_cb)
            self.service.add_socket(socket)
        elif cb_param == "wallet":
            if self.wallet is not None:
                logging.error("got extra wallet socket, closing.")
                socket.initiate_close()
                return
            logging.info("creating Wallet")
            self.wallet = Wallet("relay-wallet", 0)
            socket.register_recv_cb(self.wallet_recv_cb)
            self.wallet.add_socket(socket)
        else:
            logging.error("unknown param: %s" % cb_param)

    def socket_close_cb(self, socket):
        logging.info("got socket close: %s" % (socket))
        if self.service and self.service.has_this_socket(socket):
            self.service.remove_socket()
            self.service = None
            return
        if self.wallet and self.wallet.has_this_socket(socket):
            self.wallet.remove_socket()
            self.wallet = None
            return

    def run_app(self):
        print("listening as service at: %s" % self.service_listen_url)
        self.interconnect.listen(self.service_listen_url,
                                 tls_info=self.service_tls_info,
                                 cb_param="service")
        print("listening as wallet at: %s" % self.wallet_listen_url)
        self.interconnect.listen(self.wallet_listen_url,
                                 tls_info=self.wallet_tls_info,
                                 cb_param="wallet")

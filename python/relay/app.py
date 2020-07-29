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

from relay.pairing import Pairing




class Relay(object):
    def __init__(self, config):
        self.config = config
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        self.sockets = {}
        self.listen_url = self.get_listen_url(self.config['Relay'])
        self.tls_info = self.get_tls_info(self.config['Relay'])

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

    def recv_cb(self, socket, msg_dict):
        if msg_dict['request_type'] in {"PING", "PONG", "ERROR"}:
            print("got: %s" % msg_dict)
        else:
            logging.error("unknown message: %s" % msg_dict)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        logging.info("got new socket: %s %s" % (socket, cb_param))
        self.sockets[socket.uuid] = socket
        socket.register_recv_cb(self.recv_cb)

    def socket_close_cb(self, socket):
        logging.info("got socket close: %s" % (socket))
        if socket.uuid in self.sockets.keys():
            del self.sockets[socket.uuid];

    def run_app(self):
        print("listening at: %s" % self.listen_url)
        self.interconnect.listen(self.listen_url, tls_info=self.tls_info)

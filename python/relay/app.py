# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import logging
from configparser import ConfigParser
from OpenSSL import SSL

from twisted.internet import reactor
from twisted.internet.task import LoopingCall

from moneysocket.socket.websocket import WebsocketInterconnect
from moneysocket.core.service import Service
from moneysocket.core.wallet import Wallet
from moneysocket.core.wallet import Wallet

from moneysocket.core.message.notification.rendezvous_end import (
    NotifyRendezvousEnd)
from moneysocket.core.message.notification.error import NotifyError
from moneysocket.core.message.notification.rendezvous import NotifyRendezvous
from moneysocket.core.message.notification.rendezvous_becoming_ready import (
    NotifyRendezvousBecomingReady)

from relay.pairing import Pairing



class Relay(object):
    def __init__(self, config):
        self.config = config
        self.interconnect = WebsocketInterconnect(self.new_socket_cb,
                                                  self.socket_close_cb)
        self.sockets = {}
        self.listen_url = self.get_listen_url(self.config['Relay'])
        self.tls_info = self.get_tls_info(self.config['Relay'])

        self.pairing = Pairing()

        self.info_loop = LoopingCall(self.output_pairing_info)
        self.info_loop.start(2.0, now=False)

    ###########################################################################

    def output_pairing_info(self):
        logging.info(str(self.pairing))

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
            config_section['SelfSignedCert'] == "False" else None)
        return tls_info

    ###########################################################################

    def msg_recv_cb(self, socket, msg):
        if msg['message_class'] != "REQUEST":
            logging.error("got a message the relay can't undersand")
            return

        if msg['request_name'] != "REQUEST_RENDEZVOUS":
            logging.error("got a request the relay can't understand")
            return
        #logging.info("received msg: %s" % msg)
        rid = msg['rendezvous_id']
        req_ref_uuid = msg['request_uuid']
        result, peer_uuid, peer_req_ref_uuid = self.pairing.enter_rendezvous(
            rid, socket, req_ref_uuid)

        if result not in {"THIRD", "WAITING", "PAIRED"}:
            logging.error("got an unexpected pairing result")
            return

        if result == "THIRD":
            notify = NotifyError("rendezvous occupied")
            logging.info("send err: %s" % notify)
            socket.write(notify)
        elif result == "WAITING":
            notify = NotifyRendezvousBecomingReady(rid, req_ref_uuid)
            logging.info("send becoming ready: %s" % notify)
            socket.write(notify)
        else:
            assert result == "PAIRED"
            peer_socket = self.pairing.get_socket(peer_uuid)
            rendezvous_id = self.pairing.get_rid(peer_uuid)

            notify = NotifyRendezvous(rendezvous_id, req_ref_uuid)
            logging.info("send rendezvous 1: %s" % notify)
            socket.write(notify)

            notify_peer = NotifyRendezvous(rendezvous_id, peer_req_ref_uuid)
            logging.info("send rendezvous2: %s" % notify_peer)
            peer_socket.write(notify_peer)


    def cyphertext_recv_cb(self, socket, msg_bytes):
        #logging.info("relay received cyphertext: %s" % len(msg_bytes))
        if not self.pairing.is_socket_paired(socket.uuid):
            logging.error("got cyphertext from upaired socket" % len(msg_bytes))
            return
        # forward the cyphertext to the peer
        peer_socket = self.pairing.get_paired_socket(socket.uuid)
        peer_socket.write_raw(msg_bytes)
        pass

    ###########################################################################

    def send_rendezvous_end(self, socket, rid):
        notify = NotifyRendezvousEnd(rid)
        socket.write(notify)

    ###########################################################################

    def new_socket_cb(self, socket, cb_param):
        logging.info("got new socket: %s %s" % (socket, cb_param))
        socket.register_recv_cb(self.msg_recv_cb)
        socket.register_cyphertext_recv_cb(self.cyphertext_recv_cb)
        # no shared seed to register for for relay

        self.pairing.new_socket(socket)

    def socket_close_cb(self, socket):
        logging.info("got socket close: %s" % (socket))
        result, unpaired_uuid, broken_rid = self.pairing.socket_close(socket)
        assert result in {"QUIET_CLOSE", "RENDEZVOUS_END"}, "unexpected result"
        if result == "QUIET_CLOSE":
            logging.info("quiet close")
        else:
            peer_socket = self.pairing.get_socket(unpaired_uuid)
            self.send_rendezvous_end(peer_socket, broken_rid)

    def run_app(self):
        print("listening at: %s" % self.listen_url)
        self.interconnect.listen(self.listen_url, tls_info=self.tls_info)

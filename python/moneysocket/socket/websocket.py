# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid
import json

from OpenSSL import SSL

from twisted.internet import reactor, ssl

from autobahn.twisted.websocket import listenWS
from autobahn.twisted.websocket import WebSocketServerFactory
from autobahn.twisted.websocket import WebSocketServerProtocol

from autobahn.twisted.websocket import connectWS
from autobahn.twisted.websocket import WebSocketClientFactory
from autobahn.twisted.websocket import WebSocketClientProtocol

from moneysocket.socket.socket import MoneysocketSocket
from moneysocket.socket.socket import MoneysocketInterconnect
from moneysocket.socket.socket import MoneysocketConnectionAttempt


class WebsocketInterconnect(MoneysocketInterconnect):
    def __init__(self, new_socket_cb, socket_close_cb):
        super().__init__(new_socket_cb, socket_close_cb)
        self.incoming = {}
        self.outgoing = []

    def listen(self, listen_ws_url, tls_info=None, cb_param=None):
        logging.info("listening: %s" % listen_ws_url)
        i = IncomingWebsocketInterconnect(self._new_socket, self._socket_close)
        err = i.listen(listen_ws_url, tls_info=tls_info, cb_param=cb_param)
        if not err:
            self.incoming[listen_ws_url] = i
        return err

    def stop_listening(self, listen_ws_url):
        if listen_ws_url not in self.incoming.keys():
            return
        i = self.incoming[listen_ws_url]
        i.stop_listening()

    def connect(self, connect_ws_url, cb_param=None):
        logging.info("connecting: %s" % connect_ws_url)
        o = OutgoingWebsocketInterconnect(self._new_socket, self._socket_close)
        self.outgoing.append(o)
        return o.connect(connect_ws_url, cb_param)

    def initiate_close(self):
        for i in self.incoming.values():
            i.initiate_close()
        for o in self.outgoing:
            o.initiate_close()


###############################################################################


class WebsocketConnectionAttempt(MoneysocketConnectionAttempt):
    def __init__(self, connector):
        super().__init__()
        self.connector = connector

    def __str__(self):
        destination = self.connector.getDestination()
        return "<attempt status: %s to %s:%s>" % (
            self.get_state(), destination.host, destination.port)

    def stop_connecting(self):
        self.connector.stopConnecting()

    def get_state(self):
        return self.connector.state

###############################################################################

class IncomingSocket(WebSocketServerProtocol):
    def __init__(self):
        super().__init__()
        self.ms = None

    def onConnecting(self, transport_details):
        logging.info("WebSocket connecting: %s" % transport_details)

    def onConnect(self, request):
        logging.info("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        logging.info("WebSocket connection open.")
        self.ms = MoneysocketSocket()
        self.ms._register_initiate_close_func(self.initiate_close)
        self.ms._register_initiate_send_func(self.initiate_send)
        self.factory.ms_interconnect._new_socket(self.ms,
                                                 self.factory.ms_cb_param)

    def onMessage(self, payload, isBinary):
        logging.info("incoming message")
        if isBinary:
            self.handle_binary(payload)
        else:
            self.handle_text(payload)

    def onClose(self, wasClean, code, reason):
        logging.info("WebSocket connection closed: {0}".format(reason))
        if self.ms:
            self.factory.ms_interconnect._socket_close(self.ms)
            self.ms = None

    ##########################################################################

    def initiate_close(self):
        logging.info("initiating socket close")
        super().sendClose()

    def initiate_send(self, msg_dict):
        s = self.sendMessage(json.dumps(msg_dict).encode("utf8"))
        logging.info("sent message %s, got: %s" % (msg_dict, s))

    def handle_binary(self, payload):
        logging.info("binary payload: %d bytes" % len(payload))

    def handle_text(self, payload):
        logging.info("text payload: %s" % payload.decode("utf8"))
        self.ms._msg_recv(json.loads(payload.decode("utf8")))


class IncomingWebsocketInterconnect(MoneysocketInterconnect):
    def __init__(self, new_socket_cb, socket_close_cb):
        super().__init__(new_socket_cb, socket_close_cb)
        self.listener = None

    def stop_listening(self):
        if not self.listener:
            return
        logging.info("stopping listening")
        self.listener.stopListening()

    def listen(self, listen_ws_url, tls_info=None, cb_param=None):
        if listen_ws_url.startswith("wss") and not tls_info:
            return "must specify tls_info to listen with TLS"

        if tls_info:
            logging.info("listening with TLS")
            contextFactory = ssl.DefaultOpenSSLContextFactory(
                tls_info['key_file'], tls_info['cert_file'],
                sslmethod=tls_info['sslmethod'])
            factory = WebSocketServerFactory(listen_ws_url)
            factory.protocol = IncomingSocket
            factory.ms_interconnect = self
            factory.ms_cb_param = cb_param
            self.listener = listenWS(factory, contextFactory)
        else:
            logging.info("listening without TLS")
            port = int(listen_ws_url.split(":")[-1])
            factory = WebSocketServerFactory(listen_ws_url)
            factory.protocol = IncomingSocket
            factory.ms_interconnect = self
            factory.ms_cb_param = cb_param
            self.listener = reactor.listenTCP(port, factory)
        return None


###############################################################################

class OutgoingSocket(WebSocketClientProtocol):
    def __init__(self):
        super().__init__()
        self.ms = None

    def onConnecting(self, transport_details):
        logging.info("WebSocket connecting: %s" % transport_details)

    def onConnect(self, response):
        logging.info("WebSocket connection connect: %s" % response)

    def onOpen(self):
        logging.info("WebSocket connection open.")
        self.ms = MoneysocketSocket()
        self.ms._register_initiate_close_func(self.initiate_close)
        self.ms._register_initiate_send_func(self.initiate_send)
        self.factory.ms_interconnect._new_socket(self.ms,
                                                 self.factory.ms_cb_param)
        pass

    def onMessage(self, payload, isBinary):
        logging.info("outgoing message")
        if isBinary:
            self.handle_binary(payload)
        else:
            self.handle_text(payload)

    def onClose(self, wasClean, code, reason):
        logging.info("WebSocket connection closed: {0}".format(reason))
        if self.ms:
            self.factory.ms_interconnect._socket_close(self.ms)
            self.ms = None

    ##########################################################################

    def initiate_close(self):
        super().sendClose()

    def initiate_send(self, msg_dict):
        s = self.sendMessage(json.dumps(msg_dict).encode("utf8"))
        logging.info("sent message %s, got: %s" % (msg_dict, s))

    def handle_binary(self, payload):
        logging.info("binary payload: %d bytes" % len(payload))

    def handle_text(self, payload):
        logging.info("text payload: %s" % payload.decode("utf8"))
        self.ms._msg_recv(json.loads(payload.decode("utf8")))

    ##########################################################################


class OutgoingWebsocketInterconnect(MoneysocketInterconnect):
    def connect(self, connect_ws_url, cb_param):
        logging.info("connect")
        factory = WebSocketClientFactory(connect_ws_url)
        logging.info("factory: %s" % factory)
        factory.protocol = OutgoingSocket
        logging.info("factory 2 : %s" % factory)
        factory.ms_interconnect = self
        factory.ms_cb_param = cb_param
        logging.info("factory 3h: %s" % factory)
        logging.info("connecting")
        c = connectWS(factory, timeout=10)
        logging.info("connect: %s" % c)
        return WebsocketConnectionAttempt(c)

    def connect_tls(self, ws_url, cb_param):
        logging.info("connect: %s" % c)
        factory = WebSocketClientFactory(connect_ws_url)
        factory.protocol = OutgoingSocket
        factory.ms_interconnect = self
        factory.ms_cb_param = cb_param
        contextFactory = ssl.ClientContextFactory()
        c = connectWS(factory, contextFactory)
        return WebsocketConnectionAttempt(c)


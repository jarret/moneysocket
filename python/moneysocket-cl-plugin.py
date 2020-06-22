#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import os
import time
import json

from OpenSSL import SSL

from twisted.internet import reactor, ssl
from autobahn.twisted.websocket import listenWS

from pyln.client import Plugin

from moneysocket.lightning_node import CLightningNode
from moneysocket.server import MoneysocketServer

plugin = Plugin()

node = CLightningNode(plugin)

CATEGORY = "Moneysocket"

MONEYSOCKET_STATE = "moneysocket-db.json"
MONEYSOCKET_PORT = 5400

# NOTE - wrapping the websocket with a cert is needed for some
# development/testing for interop on local LAN configs. A cert.key and cert.pem
# file need to be generated and put in the path to be picked up here. Also, the
# browser connecting in will need to add an exception for the cert.
USE_WSS = False

###############################################################################

def setup_websocket_server(state_filename, port):
    if USE_WSS:
        contextFactory = ssl.DefaultOpenSSLContextFactory(
            "cert.key", "cert.pem", sslmethod=SSL.TLSv1_2_METHOD)
        factory = MoneysocketServer(u"wss://0.0.0.0:%s" % port, state_filename,
                                    node)
        listenWS(factory, contextFactory)
    else:
        factory = MoneysocketServer(u"ws://127.0.0.1:%s" % port, state_filename,
                                    node)
        reactor.listenTCP(port, factory)

@plugin.init()
def init(options, configuration, plugin, **kwargs):
    state_filename = plugin.get_option("moneysocket_state")
    port = int(plugin.get_option("moneysocket_port"))
    plugin.log("state file %s" % state_filename)
    reactor.callFromThread(setup_websocket_server, state_filename, port)

###############################################################################


plugin.add_option("moneysocket_state", MONEYSOCKET_STATE,
                  "the file for the plugin to save state to")
plugin.add_option("moneysocket_port", MONEYSOCKET_PORT,
                  "port to listen for websocket connections on")

def plugin_thread():
    plugin.run()
    reactor.callFromThread(reactor.stop)

reactor.callInThread(plugin_thread)
reactor.run()

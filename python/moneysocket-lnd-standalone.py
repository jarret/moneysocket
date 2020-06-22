#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import os
import sys
import time
import json

from twisted.internet import reactor

from lnd_grpc import Client

from moneysocket.server import MoneysocketServer

from moneysocket.lightning_node import LndNode

LND_DIR = os.path.join(os.path.expanduser("~"), ".lnd")

print("lnd dir: %s" % LND_DIR)

if not os.path.exists(LND_DIR):
    sys.exit("does not exist: %s" % LND_DIR)

macaroon_path = os.path.join(LND_DIR,
                             "data/chain/bitcoin/mainnet/admin.macaroon")
tls_cert_path = os.path.join(LND_DIR, "tls.cert")
network = "bitcoin"
grpc_host = "localhost"
grpc_port = 10009

c = Client(LND_DIR, macaroon_path, tls_cert_path, network, grpc_host, grpc_port)

print(c.get_info())
#sys.exit("quit for now")

#c = None

lightning_node = LndNode(c)


MONEYSOCKET_STATE = os.path.join(LND_DIR, "moneysocket-db.json")
MONEYSOCKET_PORT = 5401

def setup_websocket_server(state_filename, port):
    factory = MoneysocketServer(u"ws://0.0.0.0:%s" % port, state_filename,
                                lightning_node)
    reactor.listenTCP(port, factory)

setup_websocket_server(MONEYSOCKET_STATE, MONEYSOCKET_PORT)
reactor.run()


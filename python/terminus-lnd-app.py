#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import os
import sys
import time
import json
import argparse
import logging

from configparser import ConfigParser

from twisted.internet import reactor

from lnd_grpc import Client

from moneysocket.lightning.lnd import Lnd
from terminus.app import Terminus


DEFAULT_LND_DIR = os.path.join(os.path.expanduser("~"), ".lnd")

print("lnd dir: %s" % DEFAULT_LND_DIR)



DEFAULT_WALLET_CONFIG = os.path.join(DEFAULT_LND_DIR,
                                     "./moneysocket-terminus.conf")


CONFIG_FILE_HELP = """ Configuration settings to app run instance with. """
parser = argparse.ArgumentParser(prog="terminus-lnd-app.py")
parser.add_argument('-c', '--config', type=str,
                    default=DEFAULT_WALLET_CONFIG,
                    help=CONFIG_FILE_HELP)
settings = parser.parse_args()

settings.config = os.path.abspath(settings.config)
if not os.path.exists(settings.config):
    sys.exit("*** can't use config: %s" % settings.config)

config = ConfigParser()
config.read(settings.config)

logging.basicConfig(level=logging.DEBUG)

lnd_dir = config['LND']['LndDir']
macaroon_path = config['LND']['MacaroonPath']
tls_cert_path = config['LND']['TlsCertPath']
network = config['LND']['Network']
grpc_host = config['LND']['GrpcHost']
grpc_port = int(config['LND']['GrpcPort'])

c = Client(lnd_dir, macaroon_path, tls_cert_path, network, grpc_host, grpc_port)
print(c.get_info())
lnd = Lnd(c)

app = Terminus(config, lnd)
app.run_app()

reactor.run()


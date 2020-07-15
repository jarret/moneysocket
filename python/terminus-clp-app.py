#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import os
import time
import json
import logging

from configparser import ConfigParser

from OpenSSL import SSL

from twisted.internet import reactor, ssl
from autobahn.twisted.websocket import listenWS

from pyln.client import Plugin

from moneysocket.lightning.clightning import CLightning

from terminus.app import Terminus

plugin = Plugin()

CLIGHTNING = CLightning(plugin)

def run_app(wallet_config_file):
    config = ConfigParser()
    config.read(wallet_config_file)

    app = Terminus(config, CLIGHTNING)
    app.run_app()

@plugin.init()
def init(options, configuration, plugin, **kwargs):
    terminus_config_file = plugin.get_option("moneysocket_terminus_config")
    plugin.log("using config file %s" % os.path.abspath(terminus_config_file))
    reactor.callFromThread(run_app, terminus_config_file)

DEFAULT_WALLET_CONFIG = "./moneysocket-terminus.conf"

plugin.add_option("moneysocket_terminus_config", DEFAULT_WALLET_CONFIG,
                  "config file to obtain settings")

def plugin_thread():
    plugin.run()
    reactor.callFromThread(reactor.stop)

logging.basicConfig(level=logging.DEBUG)

reactor.callInThread(plugin_thread)
reactor.run()

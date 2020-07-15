#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import argparse
import logging
from configparser import ConfigParser

from twisted.internet import reactor

from junction.app import Junction

CONFIG_FILE_HELP = """ Configuration settings to app run instance with. """
parser = argparse.ArgumentParser(prog="junction-app.py")
parser.add_argument('-c', '--config', type=str,
                    default="./junction/junction-0.conf",
                    help=CONFIG_FILE_HELP)
settings = parser.parse_args()

settings.config = os.path.abspath(settings.config)
if not os.path.exists(settings.config):
    sys.exit("*** can't use config: %s" % settings.config)

config = ConfigParser()
config.read(settings.config)

logging.basicConfig(level=logging.DEBUG)
logging.info("using config: %s" % settings.config)

app = Junction(config)
app.run_app()

reactor.run()

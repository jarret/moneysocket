# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys
import logging
import traceback
import argparse

from twisted.conch.telnet import TelnetProtocol

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.beacon.beacon import MoneysocketBeacon

###############################################################################

class ArgumentParser(argparse.ArgumentParser):
    INTERFACE = None

    def error(self, message):
        """ This is a bit of a hack to avoid exiting the program and pass up
            error message from subparsers """
        self.INTERFACE.send_usage = True
        self.INTERFACE.send_message = message

###############################################################################


class AppTelnetInterface(TelnetProtocol):
    APP = None

    def __init__(self):
        super().__init__()
        self.config = self.APP.config
        self.usages = None
        self.APP.set_telnet_interface(self)
        self.send_usage = False
        self.send_message = None
        ArgumentParser.INTERFACE = self
        self.prompt = b"> "
        self.subparser = {}

    ##########################################################################

    @staticmethod
    def run_interface(config):
        sys.exit("implement in subclass")

    def prep_parser(self):
        sys.exit("implement in subclass")

    ##########################################################################

    def get_default_listen_beacon_location(self):
        use_tls = self.config['Listen']['UseTLS'] == "True"
        host = self.config['Listen']['ExternalHost']
        port = int(self.config['Listen']['ExternalPort'])
        return WebsocketLocation(host, port=port, use_tls=use_tls)

    def gen_default_listen_beacon(self):
        beacon = MoneysocketBeacon()
        beacon.add_location(self.get_default_listen_beacon_location())
        return beacon

    def parse(self, args):
        parser = self.prep_parser()
        if not args or len(args) == 0:
            self.transport.write((parser.format_usage() + "\n").encode("utf8"))
            return None

        try:
            parsed = parser.parse_args(args)
        except Exception as e:
            #print(traceback.format_exc())
            logging.debug("parse args exception: %s" % e)
            pass

        if self.send_usage:
            self.send_usage = False
            msg = self.send_message
            self.transport.write((msg + "\n\n").encode("utf8"))
            return None
        if not parsed.subparser_name:
            self.transport.write((parser.format_usage() + "\n").encode("utf8"))
            return None

        return parsed


    def dataReceived(self, data):
        args = data.decode("utf8").rstrip().split(" ")
        args = [a for a in args if a != ""]
        args = self.parse(args)
        if not args:
            self.transport.write(self.prompt)
            return

        cmd_response = args.cmd_func(args)

        self.transport.write((cmd_response + "\n").encode("utf8"))
        self.transport.write(self.prompt)

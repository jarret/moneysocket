# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import traceback
import argparse

from twisted.conch.telnet import TelnetTransport
from twisted.internet.protocol import ServerFactory
from twisted.application.internet import TCPServer

from utl.telnet_interface import AppTelnetInterface, ArgumentParser

###############################################################################


class TerminusTelnetInterface(AppTelnetInterface):
    APP = None

    def __init__(self):
        super().__init__()
        self.prompt = b"terminus> "

    @staticmethod
    def run_interface(config):
        factory = ServerFactory()
        factory.protocol = lambda: TelnetTransport(TerminusTelnetInterface)
        port = int(config['App']['TelnetInterfacePort'])
        logging.info("starting telnet cli interface on port %d" % port)
        service = TCPServer(port, factory)
        service.startService()

    def prep_parser(self):
        parser = ArgumentParser()

        subparsers = parser.add_subparsers(dest="subparser_name",
                                           title='commands',
                                           description='valid app commands',
                                           help='app commands')

        parser_ls = subparsers.add_parser('ls', help='list summary')
        parser_ls.set_defaults(cmd_func=self.APP.ls)

        parser_new_wallet = subparsers.add_parser("newwallet")
        parser_new_wallet.set_defaults(cmd_func=self.APP.newwallet)
        parser_new_wallet.add_argument("msatoshis", type=int,
                                       help="spending amount in wallet")

        parser_rm_wallet = subparsers.add_parser("rmwallet",
            help="remove wallet")
        parser_rm_wallet.set_defaults(cmd_func=self.APP.rmwallet)
        parser_rm_wallet.add_argument("wallet", type=str,
                                      help="wallet to remove")

        parser_connect = subparsers.add_parser('connect',
                                               help='connect to websocket')
        parser_connect.set_defaults(cmd_func=self.APP.connect)
        parser_connect.add_argument("connect_ws_url", help="url to connect to")
        parser_connect.add_argument("wallet", type=str,
                                    help="wallet or service for connection")

        parser_listen = subparsers.add_parser('listen',
                                              help='listen to websocket')
        parser_listen.set_defaults(cmd_func=self.APP.listen)
        listen_url_default = self.get_default_listen_url()
        parser_listen.add_argument('listen_ws_url', type=str,
            default=listen_url_default,
            help="websocket bind addr typically ws://127.0.0.1 or ws://0.0.0.0 "
                 "with port and wss:// for TLS (default=%s)" %
                 listen_url_default)
        parser_listen.add_argument("wallet", type=str,
            help="wallet to match with connections")

        parser_clear = subparsers.add_parser('clearconnection',
            help='clear connections for wallet')
        parser_clear.set_defaults(cmd_func=self.APP.clearconnection)
        parser_clear.add_argument("wallet", type=str, help="wallet to clear")

        parser_help = subparsers.add_parser('help', help='get command usage')
        parser_help.set_defaults(cmd_func=self.APP.help)
        parser_help.add_argument("cmd", type=str,
                                 help="get usage of command")

        self.subparsers = {'ls':               parser_ls,
                           'newwallet':        parser_new_wallet,
                           'rmwallet':         parser_rm_wallet,
                           'connect':          parser_connect,
                           'listen':           parser_listen,
                           'clearconnection':  parser_clear,
                           'help':             parser_help}
        return parser

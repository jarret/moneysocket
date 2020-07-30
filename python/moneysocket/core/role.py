# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid

class Role(object):
    def __init__(self, name):
        self.uuid = uuid.uuid4()
        self.name = name
        self.socket = None
        self.connection_attempt = None
        self.attributes = {}

    def __hash__(self):
        return hash(self.name)

    ###########################################################################

    def add_attribute(self, name, attribute):
        self.attributes[name] = attribute

    def remove_attribute(self, name):
        if name in self.attributes.keys():
            del self.attributes[name]

    def iter_attributes(self):
        for name, attribute in self.attributes.items():
            yield name, attribute

    def iter_str_lines(self):
        if self.connection_attempt:
            c = str(self.connection_attempt)
        elif self.socket:
            c = str(self.socket)
        else:
            c = "(not connected)"
        yield "\t%s : connection status: %s" % (self.name, c)
        for name, attribute in self.iter_attributes():
            yield "\t\t%s: %s" % (name, attribute)

    def __str__(self):
        return "\n".join(self.iter_str_lines())

    ###########################################################################

    def add_socket(self, socket):
        logging.info("%s is adding socket %s" % (self.name, socket))
        self.socket = socket
        self.connection_attempt = None

    def has_socket(self):
        return self.socket is not None

    def get_socket(self):
        return self.socket

    def has_this_socket(self, socket):
        if not self.has_socket():
            return False
        return socket.uuid == self.socket.uuid

    def remove_socket(self):
        logging.info("%s is removing socket %s" % (self.name, self.socket))
        self.socket = None

    ###########################################################################

    def add_connection_attempt(self, connection_attempt):
        logging.info("%s added %s" % (self.name, connection_attempt))
        self.connection_attempt = connection_attempt

    def has_connection_attempt(self):
        return self.connection_attempt is not None

    def is_connecting(self):
        if self.socket:
            return False
        if not self.connection_attempt:
            return False
        return self.connection_attempt.get_state() == "connecting"

    def remove_connection_attempt(self):
        if not self.connection_attempt:
            return
        logging.info("%s removing %s" % (self.name, connection_attempt))
        if self.connection_attempt.get_state() == "connecting":
            self.connection_attempt.stop_connecting()
        self.connection_attempt = None

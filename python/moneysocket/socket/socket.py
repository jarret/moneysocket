# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid


class MoneysocketSocket(object):
    def __init__(self):
        self.uuid = uuid.uuid4()
        self.msg_recv_cb = None
        self.initiate_close_func = None
        self.initiate_send_func = None

    def __str__(self):
        return "<socket uuid=%s>" % str(self.uuid)[:8]

    ###########################################################################

    def register_recv_cb(self, cb):
        """ Client of API must register a callback which will be used to
            deliver messages recieved from the socket.
        """
        self.msg_recv_cb = cb

    def write(self, msg_dict):
        """ Write msg a message to the socket.
        """
        if not self.initiate_send_func:
            logging.error("no send initialized")
            return
        self.initiate_send_func(msg_dict)

    def close(self):
        """ Closes the socket.
        """
        if not self.initiate_close_func:
            logging.error("no close initialized")
            return
        self.initiate_close_func()

    ###########################################################################

    def _register_initiate_close_func(self, func):
        self.initiate_close_func = func

    def _register_initiate_send_func(self, func):
        self.initiate_send_func = func

    def _msg_recv(self, msg_dict):
        if not self.msg_recv_cb:
            logging.error("no recv callback registered!")
            return
        self.msg_recv_cb(self, msg_dict)


###############################################################################

CONNECTION_ATTEMPT_STATES = {'connecting', 'connected', 'disconnected'}

class MoneysocketConnectionAttempt(object):
    """ object representing an in-progress connection attempt """
    def __init__(self):
        pass

    def get_state(self):
        return "disconnected"

    def stop_connecting(self):
        pass

###############################################################################

class MoneysocketInterconnect(object):
    def __init__(self, new_socket_cb, socket_close_cb):
        self.new_cb = new_socket_cb
        self.close_cb = socket_close_cb
        self.sockets = {}

    ###########################################################################

    def close(self):
        """ Initiates the close all sockets created by this interconnect """
        sockets = self.sockets.values()
        for socket in sockets:
            socket.close()

    ##########################################################################

    def _new_socket(self, socket, cb_param):
        self.sockets[socket.uuid] = socket
        if not self.new_cb:
            logging.error("no new socket callback registered!")
            return
        self.new_cb(socket, cb_param)

    def _socket_close(self, socket):
        uuid = socket.uuid
        if uuid in self.sockets.keys():
            del self.sockets[uuid]
        if not self.close_cb:
            logging.error("no close callback registered!")
            return
        self.close_cb(socket)

# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid
import time


from moneysocket.core.message.request.rendezvous import RequestRendezvous
from moneysocket.core.message.notification.rendezvous import NotifyRendezvous
from moneysocket.core.message.notification.error import NotifyError


STATE_NAMES = ["INIT",
               "RENDEZVOUS_SETUP",
               "ROLE_OPERATE"]

STATES = set(STATE_NAMES)


class Role(object):
    def __init__(self, name):
        self.uuid = uuid.uuid4()
        self.name = name
        self.socket = None
        self.connection_attempt = None
        self.attributes = {}
        self.state = None
        self.set_state("INIT")
        self.outstanding_pings = {}

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

    def set_state(self, new_state):
        assert new_state in STATES
        self.state = new_state

    def assert_state(self, expected_state):
        assert self.state == expected_state, "unexpected state: %s/%s" % (
            self.state, expected_state)

    ###########################################################################

    def handle_request_rendezvous(self, msg):
        # TODO has this always been pre-screened by the app?
        req_ref_uuid = msg['request_reference_uuid']
        rid = msg['rendezvous_id']
        if self.state != "INIT":
            socket.write(NotifyError("not in state to rendezvous",
                                     request_reference_uuid=req_ref_uuid))
            return
        self.socket.write(NotifyRendezvous(rid, req_ref_uuid))
        self.set_state("ROLE_OPERATE")

    def handle_request_ping(self, msg):
        # TODO has this always been pre-screened by the app?
        req_ref_uuid = msg['request_reference_uuid']
        if self.state != "ROLE_OPERATE":
            socket.write(NotifyError("not in state to respond to ping",
                                     request_reference_uuid=req_ref_uuid))
            return
        # TODO hook for app to decide how to respond
        self.socket.write(NotifyPong(req_ref_uuid))

    def handle_request(self, msg):
        n = msg['request_name']
        if n == "REQUEST_RENDEZVOUS":
            self.handle_request_rendezvous(msg)
        elif n == "REQUEST_PING":
            self.handle_request_ping(msg)
        else:
            logging.error("unknown request?: %s" % n)
            pass

    ###########################################################################

    def handle_notify_rendezvous(self, msg):
        rid = msg['rendezvous_id']
        if self.state != "RENDEZVOUS_SETUP":
            logging.error("not in rendezvousing setup state")
            # TODO do we notify on error?
            return
        self.set_state("ROLE_OPERATE")

    def handle_notify_rendezvous_becoming_ready(self, msg):
        rid = msg['rendezvous_id']
        if self.state != "RENDEZVOUS_SETUP":
            logging.error("not in rendezvousing setup state")
            # TODO do we notify on error?
            return

        # TODO - hook for app
        logging.info("waiting for peer to rendezvous")
        self.set_state("RENDEZVOUS_SETUP")

    def handle_notify_rendezvous_end(self, msg):
        rid = msg['rendezvous_id']
        logging.info("rendezvous ended, attempting re-establish")
        # TODO - can we get this during rendezvouing?
        self.set_state("INIT")
        self.socket.write(RequestRendezvous(rid))

    def handle_notify_pong(self, msg):
        req_ref_uuid = msg['request_reference_uuid']
        if self.state != "ROLE_OPERATE":
            logging.error("got unexpected pong")
            return
        if req_ref_uuid not in self.outstanding_pings:
            logging.error("got pong with unknown request uuid")
            return

        start_time = self.outstanding_pings[req_ref_uuid]
        elapsed = time.time() - start_time
        logging.info("PING TIME: %.3fms" * (elapsed * 1000))

    def handle_notify_error(self, msg):
            logging.error("got error: %s" % msg['error_msg'])

    def handle_notification(self, msg):
        n = msg['notification_name']
        if n == "NOTIFY_RENDEZVOUS":
            self.handle_notify_rendezvous(msg)
        elif n == "NOTIFY_RENDEZVOUS_BECOMING_READY":
            self.handle_notify_rendezvous_becoming_ready(msg)
        elif n == "NOTIFY_RENDEZVOUS_END":
            self.handle_notify_rendezvous_end(msg)
        elif n == "NOTIFY_PONG":
            self.handle_notify_pong(msg)
        elif n == "NOTIFY_ERROR":
            self.handle_notify_error(msg)
        else:
            logging.error("unknown notification?: %s" % n)
            pass

    ###########################################################################

    def msg_recv_cb(self, socket, msg):
        assert socket.uuid == self.socket.uuid, "crossed socket?"
        logging.info("role received msg: %s" % msg)
        if msg['message_class'] == "REQUEST":
            self.handle_request(msg)
        elif msg['message_class'] == "NOTIFICATION":
            self.handle_notification(msg)
        else:
            logging.error("unexpected message")
            return

    ###########################################################################

    def send_ping(self):
        self.assert_state("ROLE_OPERATE")
        msg = RequestPing()
        req_ref_uuid = msg['request_uuid']
        self.outstanding_pings[req_ref_uuid] = time.time()
        self.socket.write(msg)

    def start_rendezvous(self, rid):
        self.assert_state("INIT")
        self.set_state("RENDEZVOUS_SETUP")
        msg = RequestRendezvous(rid.hex())
        logging.info("sending: %s" % msg)
        self.socket.write(msg)
        logging.info("writing request rendezvous: %s" % rid.hex())

    ###########################################################################

    def add_socket(self, socket):
        logging.info("%s is adding socket %s" % (self.name, socket))
        socket.register_recv_cb(self.msg_recv_cb)
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

# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid
import time


from moneysocket.core.message.request.rendezvous import RequestRendezvous
from moneysocket.core.message.notification.rendezvous import NotifyRendezvous
from moneysocket.core.message.notification.error import NotifyError
from moneysocket.core.message.notification.pong import NotifyPong


STATE_NAMES = ["INIT",
               "RENDEZVOUS_SETUP",
               "PROVIDER_SETUP",
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
        self.hooks = {}

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
        logging.info("new state: %s" % new_state)
        assert new_state in STATES
        self.state = new_state

    def assert_state(self, expected_state):
        assert expected_state in STATES
        assert self.state == expected_state, "unexpected state: %s/%s" % (
            self.state, expected_state)

    ###########################################################################

    def handle_request_rendezvous(self, msg):
        # TODO has this always been pre-screened by the app?
        req_ref_uuid = msg['request_uuid']
        rid = msg['rendezvous_id']
        self.socket.write(NotifyRendezvous(rid, req_ref_uuid))
        self.set_state("PROVIDER_SETUP")

    def handle_request_ping(self, msg):
        req_ref_uuid = msg['request_uuid']
        if self.state != "ROLE_OPERATE":
            self.socket.write(NotifyError("not in state to respond to ping",
                                          request_reference_uuid=req_ref_uuid))
            return
        self.socket.write(NotifyPong(req_ref_uuid))

    def handle_request_provider(self, msg):
        req_ref_uuid = msg['request_uuid']
        if self.state != "PROVIDER_SETUP":
            self.socket.write(
                NotifyError("not in state to handle provider request",
                            request_reference_uuid=req_ref_uuid))
            return

        # TODO can we handle wallet/provider role without touching app code?

        if "REQUEST_PROVIDER" not in self.hooks:
            self.socket.write(NotifyError("no provider here",
                                          request_reference_uuid=req_ref_uuid))
            return
        provider_msg = self.hooks['REQUEST_PROVIDER'](msg, self)
        if provider_msg['notification_name'] == "NOTIFY_PROVIDER":
            self.set_state("ROLE_OPERATE")
        self.socket.write(provider_msg)

    def handle_request_invoice(self, msg):
        req_ref_uuid = msg['request_uuid']
        if self.state != "ROLE_OPERATE":
            self.socket.write(
                NotifyError("not in state to handle provider request",
                            request_reference_uuid=req_ref_uuid))
            return

        if "REQUEST_INVOICE" not in self.hooks:
            self.socket.write(NotifyError("no provider here",
                                          request_reference_uuid=req_ref_uuid))
            return
        provider_msg = self.hooks['REQUEST_INVOICE'](msg, self)
        self.socket.write(provider_msg)

    def handle_request_pay(self, msg):
        req_ref_uuid = msg['request_uuid']
        if self.state != "ROLE_OPERATE":
            self.socket.write(
                NotifyError("not in state to handle provider request",
                            request_reference_uuid=req_ref_uuid))
            return

        if "REQUEST_PAY" not in self.hooks:
            self.socket.write(NotifyError("no provider here",
                                          request_reference_uuid=req_ref_uuid))
            return
        provider_msgs = self.hooks['REQUEST_PAY'](msg, self)
        for msg in provider_msgs:
            self.socket.write(msg)

    def handle_request(self, msg):
        n = msg['request_name']
        if n == "REQUEST_RENDEZVOUS":
            self.handle_request_rendezvous(msg)
        elif n == "REQUEST_PING":
            self.handle_request_ping(msg)
        elif n == "REQUEST_PROVIDER":
            self.handle_request_provider(msg)
        elif n == "REQUEST_INVOICE":
            self.handle_request_invoice(msg)
        elif n == "REQUEST_PAY":
            self.handle_request_pay(msg)
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
        self.set_state("PROVIDER_SETUP")

        if "NOTIFY_RENDEZVOUS" in self.hooks:
            self.hooks['NOTIFY_RENDEZVOUS'](msg, self)

    def handle_notify_rendezvous_becoming_ready(self, msg):
        rid = msg['rendezvous_id']
        logging.info("waiting for peer to rendezvous")
        self.set_state("RENDEZVOUS_SETUP")

        if "NOTIFY_RENDEZVOUS_BECOMING_READY" in self.hooks:
            self.hooks['NOTIFY_RENDEZVOUS_BECOMING_READY'](msg, self)

    def handle_notify_rendezvous_end(self, msg):
        rid = msg['rendezvous_id']
        logging.info("rendezvous ended, attempting re-establish")
        # TODO - can we get this during rendezvouing?
        self.set_state("INIT")
        self.socket.write(RequestRendezvous(rid))
        pass

    def handle_notify_pong(self, msg):
        req_ref_uuid = msg['request_reference_uuid']
        if self.state != "ROLE_OPERATE":
            logging.error("got unexpected pong")
            return
        if "NOTIFY_PONG" in self.hooks:
            self.hooks['NOTIFY_PONG'](msg, self)

    def handle_notify_provider(self, msg):
        if self.state != "PROVIDER_SETUP":
            logging.error("not in provider setup state")
            # TODO do we notify on error?
            return
        self.set_state("ROLE_OPERATE")
        if "NOTIFY_PROVIDER" in self.hooks:
            self.hooks['NOTIFY_PROVIDER'](msg, self)

    def handle_notify_provider_becoming_ready(self, msg):
        if self.state != "PROVIDER_SETUP":
            logging.error("not in provider setup state")
            # TODO do we notify on error?
            return
        if "NOTIFY_PROVIDER_BECOMING_READY" in self.hooks:
            self.hooks['NOTIFY_PROVIDER_BECOMING_READY'](msg, self)

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
        elif n == "NOTIFY_PROVIDER":
            self.handle_notify_provider(msg)
        elif n == "NOTIFY_PROVIDER_BECOMING_READY":
            self.handle_notify_provider_becoming_ready(msg)
        elif n == "NOTIFY_ERROR":
            self.handle_notify_error(msg)
        else:
            logging.error("unknown notification?: %s" % n)
            pass

    ###########################################################################

    def msg_recv_cb(self, socket, msg):
        assert socket.uuid == self.socket.uuid, "crossed socket?"
        #logging.info("role received msg: %s" % msg)
        if msg['message_class'] == "REQUEST":
            self.handle_request(msg)
        elif msg['message_class'] == "NOTIFICATION":
            self.handle_notification(msg)
        else:
            logging.error("unexpected message")
            return

    ###########################################################################

    def send_ping(self):
        #self.assert_state("ROLE_OPERATE")
        msg = RequestPing()
        req_ref_uuid = msg['request_uuid']
        self.outstanding_pings[req_ref_uuid] = time.time()
        self.socket.write(msg)

    def start_rendezvous(self, rid):
        #self.assert_state("INIT")
        self.set_state("RENDEZVOUS_SETUP")
        msg = RequestRendezvous(rid.hex())
        logging.info("sending: %s" % msg)
        self.socket.write(msg)
        logging.info("writing request rendezvous: %s" % rid.hex())

    ###########################################################################

    def register_app_hooks(self, hook_dict):
        self.hooks = hook_dict;

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

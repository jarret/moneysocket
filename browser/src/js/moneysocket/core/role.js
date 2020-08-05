// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;
const Timestamp = require('../utl/timestamp.js').Timestamp;
const BinUtl = require('../utl/bin.js').BinUtl;


const NotifyError = require('./message/notification/error.js').NotifyError;
const NotifyRendezvous = require(
    './message/notification/rendezvous.js').NotifyRendezvous;
const NotifyPong = require('./message/notification/pong.js').NotifyPong;

const RequestRendezvous = require(
    './message/request/rendezvous.js').RequestRendezvous;
const RequestPing = require( './message/request/ping.js').RequestPing;



const STATES = new Set(["INIT",
                        "RENDEZVOUS_SETUP",
                        "ROLE_OPERATE",
                       ]);

class Role {
    constructor(name) {
        this.uuid = Uuid.uuidv4()
        this.name = name
        this.socket = null;

        this.state = null;
        this.setState("INIT");
        this.hooks = {};
    }

    ///////////////////////////////////////////////////////////////////////////

    setState(new_state) {
        console.assert(STATES.has(new_state));
        this.state = new_state;
    }

    assertState(expected_state) {
        console.assert(STATES.has(expected_state));
        console.log("expected: " + expected_state + " actual: " + this.state);
        console.assert(expected_state == this.state);
    }

    ///////////////////////////////////////////////////////////////////////////

    handleRequestRendezvous(msg) {
        // TODO will this come to browser javascript ever?
        var req_ref_uuid = msg['request_uuid'];
        var rid = msg['rendezvous_id'];
        if (this.state != "INIT") {
            socket.write(new NotifyError("not in state to rendezvous",
                                         req_ref_uuid));
            return;
        }
        this.socket.write(new NotifyRendezvous(rid, req_ref_uuid))
    }

    handleRequestPing(msg) {
        var req_ref_uuid = msg['request_uuid'];
        if (this.state != "ROLE_OPERATE") {
            this.socket.write(
                new NotifyError("not in state to respond to ping",
                                req_ref_uuid));
            return;
        }
       // TODO hook for app to decide how to respond
        this.socket.write(new NotifyPong(req_ref_uuid));
    }

    handleRequestProvider(msg) {
        var req_ref_uuid = msg['request_uuid'];
        if (this.state != "ROLE_OPERATE") {
            this.socket.write(
                new NotifyError("not in state to handle provider request",
                                req_ref_uuid));
            return;
        }
        if (! "REQUEST_PROVIDER" in this.hooks) {
            this.socket.write(NotifyError("no provider here", req_ref_uuid));
            return
        }
        provider_msg = self.hooks['REQUEST_PROVIDER'](msg, this);
        this.socket.write(provider_msg);
    }

    handleRequest(msg) {
        var name = msg['request_name']
        if (name == "REQUEST_RENDEZVOUS") {
            this.handleRequestRendezvous(msg);
        } else if (name == "REQUEST_PING") {
            this.handleRequestPing(msg);
        } else if (name == "REQUEST_PROVIDER") {
            this.handleRequestProvider(msg);
        } else {
            console.error("unknown request?: " + name);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    handleNotifyRendezvous(msg) {
        var rid = msg['rendezvous_id'];
        if (this.state != "RENDEZVOUS_SETUP") {
            console.error("not in rendezvousing setup state")
            // TODO do we notify on error?
            return;
        }
        this.setState("ROLE_OPERATE");
        if ("NOTIFY_RENDEZVOUS" in this.hooks) {
            this.hooks['NOTIFY_RENDEZVOUS'](msg, this);
        }
    }

    handleNotifyRendezvousBecomingReady(msg) {
        var rid = msg['rendezvous_id'];
        console.info("waiting for peer to rendezvous");
        this.setState("RENDEZVOUS_SETUP");

        if ("NOTIFY_RENDEZVOUS_BECOMING_READY" in this.hooks) {
            this.hooks['NOTIFY_RENDEZVOUS_BECOMING_READY'](msg, this);
        }
    }

    handleNotifyRendezvousEnd(msg) {
        var rid = msg['rendezvous_id'];
        console.log("rendezvous ended, attempting re-establish");
        // TODO - can we get this during rendezvouing?
        this.setState("INIT");
        this.socket.write(new RequestRendezvous(rid));
    }

    handleNotifyPong(msg) {
        var req_ref_uuid = msg['request_reference_uuid'];
        if (this.state != "ROLE_OPERATE") {
            console.error("got unexpected pong");
            return;
        }
        if ("NOTIFY_PONG" in this.hooks) {
            this.hooks['NOTIFY_PONG'](msg, this);
        }
    }

    handleNotifyProvider(msg) {
        if (this.state != "ROLE_OPERATE") {
            console.error("not in rendezvousing setup state")
            // TODO do we notify on error?
            return;
        }
        if ("NOTIFY_PROVIDER" in this.hooks) {
            this.hooks['NOTIFY_PROVIDER'](msg, this);
        }
    }

    handleNotifyProviderBecomingReady(msg) {
        if (this.state != "ROLE_OPERATE") {
            console.error("not in rendezvousing setup state")
            // TODO do we notify on error?
            return;
        }
        if ("NOTIFY_PROVIDER_BECOMING_READY" in this.hooks) {
            this.hooks['NOTIFY_PROVIDER_BECOMING_READY'](msg, this);
        }
    }

    handleNotifyError(msg) {
        console.error("got error: " + msg['error_msg']);
    }

    handleNotification(msg) {
        var n = msg['notification_name'];
        if (n == "NOTIFY_RENDEZVOUS") {
            this.handleNotifyRendezvous(msg);
        } else if (n == "NOTIFY_RENDEZVOUS_BECOMING_READY") {
            this.handleNotifyRendezvousBecomingReady(msg);
        } else if (n == "NOTIFY_RENDEZVOUS_END") {
            this.handleNotifyRendezvousEnd(msg);
        } else if (n == "NOTIFY_PONG") {
            this.handleNotifyPong(msg);
        } else if (n == "NOTIFY_PROVIDER") {
            this.handleNotifyProvider(msg);
        } else if (n == "NOTIFY_PROVIDER_BECOMING_READ") {
            this.handleNotifyProviderBecomingReady(msg);
        } else if (n == "NOTIFY_ERROR") {
            this.handleNotifyError(msg);
        } else {
            console.error("unknown notification?: " + n);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    msgRecvCb(socket, msg) {
        console.assert(socket.uuid == this.socket.uuid);
        console.log("role received msg: " + msg.toJson());
        if (msg['message_class'] == "REQUEST") {
            this.handleRequest(msg);
        } else if (msg['message_class'] == "NOTIFICATION") {
            this.handleNotification(msg);
        } else {
            console.error("unexpected message: " + msg['message_class']);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    sendPing() {
        this.assertState("ROLE_OPERATE");
        var msg = new RequestPing();
        this.socket.write(msg);
        return msg;
    }

    startRendezvous(rid) {
        this.assertState("INIT");
        this.setState("RENDEZVOUS_SETUP");
        var msg = new RequestRendezvous(BinUtl.b2h(rid));
        console.log("sending: " + msg.toJson());
        this.socket.write(msg);
        console.log("writing request rendezvous: " + BinUtl.b2h(rid));
    }

    ///////////////////////////////////////////////////////////////////////////

    registerAppHooks(hook_dict) {
        this.hooks = hook_dict;
    }

    ///////////////////////////////////////////////////////////////////////////

    addSocket(socket) {
        console.log(this.name + " is adding socket " + socket.toString());
        this.socket = socket;
        this.socket.registerRecvCbObj(this);
    }

    hasSocket() {
        return this.socket != null;
    }

    getSocket() {
        return this.socket;
    }

    hasThisSocket(socket) {
        if (! this.hasSocket()) {
            return false;
        }
        return socket.uuid == this.socket.uuid;
    }

    removeSocket() {
        console.log(this.name + " is removing socket " +
                    this.socket.toString());
        this.socket = null;
    }

}


exports.Role = Role;

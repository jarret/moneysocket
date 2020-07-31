// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;
const Timestamp = require('../utl/timestamp.js').Timestamp;


const NotifyError = require('./message/notification/error.js').NotifyError;
const NotifyRendezvous = require(
    './message/notification/rendezvous.js').NotifyRendezvous;
const NotifyPong = require('./message/notification/pong.js').NotifyPong;

const RequestRendezvous = require(
    './message/request/rendezvous.js').RequestRendezvous;



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
        this.outstanding_pings = {};
    }

    ///////////////////////////////////////////////////////////////////////////

    setState(new_state) {
        console.assert(STATES.has(new_state));
        this.state = new_state;
    }

    assertState(expected_state) {
        console.assert(STATES.has(expected_state));
        console.assert(expected_state == self.state);
    }

    ///////////////////////////////////////////////////////////////////////////

    handleRequestRendezvous(msg) {
        // TODO will this come to browser javascript ever?
        var req_ref_uuid = msg['request_reference_uuid'];
        var rid = msg['rendezvous_id'];
        if (this.state != "INIT") {
            socket.write(new NotifyError("not in state to rendezvous",
                                         req_ref_uuid));
            return;
        }
        this.socket.write(new NotifyRendezvous(rid, req_ref_uuid))
    }

    handleRequestPing(msg) {
        var req_ref_uuid = msg['request_reference_uuid'];
        if (this.state != "ROLE_OPERATE") {
            this.socket.write(
                new NotifyError("not in state to respond to ping",
                                req_ref_uuid));
            return;
        }
       // TODO hook for app to decide how to respond
        this.socket.write(new NotifyPong(req_ref_uuid));
    }

    handleRequest(msg) {
        n = msg['request_name']
        if (n == "REQUEST_RENDEZVOUS") {
            this.handleRequestRendezvous(msg);
        } else if (n == "REQUEST_PING") {
            this.handleRequestPing(msg);
        } else {
            console.error("unknown request?: " + n);
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
    }

    handleNotifyRendezvousBecomingReady(msg) {
        var rid = msg['rendezvous_id'];
        if (this.state != "RENDEZVOUS_SETUP") {
            console.error("not in rendezvousing setup state");
            // TODO do we notify on error?
            return;
        }
        // TODO - hook for app
        console.info("waiting for peer to rendezvous");
        this.setState("RENDEZVOUS_SETUP");
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
        if (! (req_ref_uuid in self.outstanding_pings)) {
            console.error("got pong with unknown request uuid");
            return;
        }

        var start_time = this.outstanding_pings[req_ref_uuid]
        elapsed = Timestamp.getNowTimestamp() - starr_time;
        // TODO hook for app;
        logging.info("PING TIME: " + (elapsed * 1000).toString() + "ms");
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
        var req_ref_uuid = msg['request_uuid'];
        this.outstandingPings[req_ref_uuid] = Timestamp.getNowTimestamp();
        this.socket.write(msg);
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

    addSocket(socket) {
        console.log(this.name + " is adding socket " + socket.toString());
        this.socket.registerRecvCb(this.msgRecvCb);
        this.socket = socket;
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

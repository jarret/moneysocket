// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketSocket = require('./socket.js').MoneysocketSocket;
const MoneysocketInterconnect = require('./socket.js').MoneysocketInterconnect;


class WebsocketInterconnect extends MoneysocketInterconnect {
    constructor(cb_obj) {
        super(cb_obj);
        this.outgoing = new Array();
    }

    connect(connect_ws_url, cb_param) {
        var o = new OutgoingWebsocketInterconnect(this.cb_obj);
        this.outgoing.push(o);
        o.connect(connect_ws_url, cb_param);
    }

    initiateClose() {
        for (var i = 0; i < this.outgoing.length; i++) {
            this.outgoing[i].initiateClose();
            // TODO - remove from dict
        }
    }
}


class OutgoingWebsocketInterconnect extends MoneysocketInterconnect {
    connect(connect_ws_url, cb_param) {
        var ws = new OutgoingSocket(connect_ws_url, this, cb_param);
        // TODO - handle failure.
    }
}

/* in-browser, there is only the notion of connecting outgoing with a
 * websocket, however for Node.js backend applications, this library will need
 * to figure out what to do about listening as a websocket server and managing
 * incoming sockets. */
class OutgoingSocket {
    constructor(connect_ws_url, interconnect, cb_param) {
        this.websocket = new WebSocket(connect_ws_url);
        this.cb_param = cb_param;

        this.websocket.onmessage = (function(event) {
            this.handleMessage(event);
        }).bind(this);

        this.websocket.onopen = (function(event) {
            this.handleOpen(event);
        }).bind(this);

        this.websocket.onclose = (function(event) {
            this.handleClose(event);
        }).bind(this);

        this.ms = new MoneysocketSocket(this);
        this.interconnect = interconnect;
    }

    initiateClose() {
        this.websocket.close();
        // TODO - handle close
        this.interconnect.socketClose(this.ms);
    }

    initiateSend(msg_dict) {
        this.websocket.send(JSON.stringify(msg_dict));
    }

    handleOpen(event) {
        console.log("websocket open: " + event);
        this.interconnect.newSocket(this.ms, this.cb_param);
    }

    handleMessage(event) {
        console.log("ws recv: " + event.data);
        // TODO - binary message?
        // TODO - unparsable?
        this.ms.msgRecv(JSON.parse(event.data));
    }

    handleClose(event) {
        console.log("closed");
        console.log("event: " + event);
        console.log("event.code: " + event.code);
        console.log("event.reason: " + event.reason);
        console.log("event.wasClean: " + event.wasClean);
        console.log("interconnect: " + this.interconnect);
        console.log("ms: " + this.ms);
        if (this.interconnect != null) {
            console.log("close cb sent");
            this.interconnect.socketClose(this.ms, this.cb_param);
        }
    }
}

exports.WebsocketInterconnect = WebsocketInterconnect;

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../utl/bin.js').BinUtl;
const MoneysocketSocket = require('./socket.js').MoneysocketSocket;
const MoneysocketInterconnect = require('./socket.js').MoneysocketInterconnect;


class WebsocketInterconnect extends MoneysocketInterconnect {
    constructor(cb_obj) {
        super(cb_obj);
        this.outgoing = new Array();
    }

    connect(websocket_location, cb_param) {
        var o = new OutgoingWebsocketInterconnect(this.cb_obj);
        this.outgoing.push(o);
        o.connect(websocket_location, cb_param);
    }

    initiateClose() {
        for (var i = 0; i < this.outgoing.length; i++) {
            this.outgoing[i].initiateClose();
            // TODO - remove from dict
        }
    }
}


class OutgoingWebsocketInterconnect extends MoneysocketInterconnect {
    connect(websocket_location, cb_param) {
        var ws = new OutgoingSocket(websocket_location, this, cb_param);
        // TODO - handle failure.
    }
}

/* in-browser, there is only the notion of connecting outgoing with a
 * websocket, however for Node.js backend applications, this library will need
 * to figure out what to do about listening as a websocket server and managing
 * incoming sockets. */
class OutgoingSocket {
    constructor(websocket_location, interconnect, cb_param) {
        var ws_url = websocket_location.toWsUrl();
        this.websocket = new WebSocket(ws_url);
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

    initiateSend(msg_bytes) {
        this.websocket.send(msg_bytes.buffer);
    }

    handleOpen(event) {
        console.log("websocket open: " + event);
        this.interconnect.newSocket(this.ms, this.cb_param);
    }

    handleMessageCb(msg_bytes) {

    }

    async handleMessage(event) {
        if (event.data instanceof Blob) {
            //console.log("ws recv data: " + event.data);
            var msg_bytes = await BinUtl.blob2Uint8Array(event.data);
            //console.log("msg_bytes data: " + BinUtl.b2h(msg_bytes));
            this.ms.msgRecv(msg_bytes);
        } else {
            console.error("received unexpected non-binary message");
        }
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
            this.interconnect.socketClose(this.ms);
        }
    }
}

exports.WebsocketInterconnect = WebsocketInterconnect;

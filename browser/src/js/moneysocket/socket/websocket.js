// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketSocket = require('./socket.js').MoneysocketSocket;
const MoneysocketInterconnect = require('./socket.js').MoneysocketInterconnect;


class WebsocketInterconnect extends MoneysocketInterconnect {

    constructor(new_socket_cb, socket_close_cb) {
        super(new_socket_cb, socket_close_cb);
        this.outgoing = new Array();
    }

    Connect(connect_ws_url, cb_param) {
        var o = OutgoingWebsocketInterconnect(this.new_cb, this.close_cb);
        this.outgoing.push(o);
        o.connect(connect_ws_url, cb_param);
    }

    InitiateClose() {
        for (var i = 0; i < this.outgoing.length; i++) {
            this.outgoing[i].InitiateClose();
            // TODO - remove from dict
        }
    }
}


class OutgoingWebsocketInterconnect extends MoneysocketInterconnect {
    Connect(connect_ws_url, cb_param) {
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
        this.websocket.onmessage = this.HandleMessage;
        this.websocket.onclose = this.HandleClose;
        this.ms = new MoneysocketSocket();
        this.ms.RegisterInitiateCloseFunc(this.InitateClose);
        this.ms.RegisterInitiateSendFunc(this.InitateSend);
        this.interconnect = interconnect;
        this.interconnect.NewSocket(this.ms, cb_param);
    }

    InitiateClose() {
        this.websocket.close();
        // TODO - handle close
        this.interconnect.SocketClose(this.ms);
    }

    InitiateSend(msg_dict) {
        this.websocket.send(JSON.stringify(msg_dict));
    }

    HandleMessage(event) {
        console.log("ws recv: " + event.data);
        // TODO - binary message?
        // TODO - unparsable?
        this.ms.MsgRecv(JSON.parse(event.data));
    }

    HandleClose() {
        console.log("closed");
        this.interconnect.SocketClose(this.ms);
    }
}

exports.WebsocketInterconnect = WebsocketInterconnect;

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Utl = require('../utl/utl.js').Utl;

class MoneysocketSocket {
    constructor() {
        this.uuid = Utl.uuidv4();
        this.msg_recv_cb = null;
    }

    ToString() {
        return "<socket uuid=" + this.uuid + ">";
    }

    //////////////////////////////////////////////////////////////////////////

    RegisterRecvCb(cb) {
        this.msg_recv_cb = cb;
    }

    //////////////////////////////////////////////////////////////////////////

    RegisterInitiateCloseFunc(func) {
        this.initiate_close_func = func;
    }

    RegisterInitiateSendFunc(self, func) {
        this.initiate_send_func = func;
    }

    MsgRcev(msg_dict) {
        this.msg_recv_cb(msg_dict);
    }
}

class MoneysocketInterconnect {
    constructor(new_socket_cb, socket_close_cb) {
        this.new_cb = new_socket_cb;
        this.close_cb = socket_close_cb;
        this.sockets = {}
    }

    Close() {
        for (var uuid in this.sockets) {
            this.sockets[uuid].close();
        }
    }

    NewSocket(socket, cb_param) {
        this.sockets[socket.uuid] = socket
        this.new_cb(socket, cb_param);
    }

    SocketClose(socket) {
        if (this.sockets.hasKey(socket.uuid)) {
            delete this.sockets[socket.uuid];
        }
        this.close_cb(socket);
    }
}

exports.MoneysocketSocket = MoneysocketSocket;
exports.MoneysocketInterconnect = MoneysocketInterconnect;

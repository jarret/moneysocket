// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;

class MoneysocketSocket {
    constructor(initiate_cb_obj) {
        this.uuid = Uuid.uuidv4();
        this.msg_recv_cb = null;
        console.assert(typeof initiate_cb_obj.initiateClose == 'function');
        console.assert(typeof initiate_cb_obj.initiateSend == 'function');
        this.initiate_cb_obj = initiate_cb_obj;
    }

    toString() {
        return "<socket uuid=" + this.uuid + ">";
    }

    //////////////////////////////////////////////////////////////////////////

    registerRecvCb(cb) {
        this.msg_recv_cb = cb;
    }

    //////////////////////////////////////////////////////////////////////////

    msgRecv(msg_dict) {
        this.msg_recv_cb(msg_dict);
    }

    close() {
        this.initiate_cb_obj.initiateClose();
    }

    send(msg_dict) {
        this.initiate_cb_obj.initiateSend(msg_dict);
    }
}

class MoneysocketInterconnect {
    constructor(cb_obj) {
        console.assert(typeof cb_obj.newSocket == 'function');
        console.assert(typeof cb_obj.socketClose == 'function');
        this.cb_obj = cb_obj;
        this.sockets = {};
    }

    close() {
        for (var uuid in this.sockets) {
            this.sockets[uuid].close();
        }
    }

    newSocket(socket, cb_param) {
        this.sockets[socket.uuid] = socket
        this.cb_obj.newSocket(socket, cb_param);
    }

    socketClose(socket, cb_param) {
        if (socket.uuid in this.sockets) {
            delete this.sockets[socket.uuid];
        }
        this.cb_obj.socketClose(socket, cb_param);
    }
}

exports.MoneysocketSocket = MoneysocketSocket;
exports.MoneysocketInterconnect = MoneysocketInterconnect;

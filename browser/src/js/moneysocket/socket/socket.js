// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Utl = require('../utl/utl.js').Utl;

class MoneysocketSocket {
    constructor(initiate_cb_obj) {
        this.uuid = Utl.uuidv4();
        this.msg_recv_cb = null;
        console.assert(typeof initiate_cb_obj.InitiateClose == 'function');
        console.assert(typeof initiate_cb_obj.InitiateSend == 'function');
        this.initiate_cb_obj = initiate_cb_obj;
    }

    ToString() {
        return "<socket uuid=" + this.uuid + ">";
    }

    //////////////////////////////////////////////////////////////////////////

    RegisterRecvCb(cb) {
        this.msg_recv_cb = cb;
    }

    //////////////////////////////////////////////////////////////////////////

    MsgRecv(msg_dict) {
        this.msg_recv_cb(msg_dict);
    }

    Close() {
        this.initiate_cb_obj.InitiateClose();
    }

    Send(msg_dict) {
        this.initiate_cb_obj.InitiateSend(msg_dict);
    }
}

class MoneysocketInterconnect {
    constructor(cb_obj) {
        console.assert(typeof cb_obj.NewSocket == 'function');
        console.assert(typeof cb_obj.SocketClose == 'function');
        this.cb_obj = cb_obj;
        this.sockets = {};
    }

    Close() {
        for (var uuid in this.sockets) {
            this.sockets[uuid].close();
        }
    }

    NewSocket(socket, cb_param) {
        this.sockets[socket.uuid] = socket
        this.cb_obj.NewSocket(socket, cb_param);
    }

    SocketClose(socket, cb_param) {
        if (socket.uuid in this.sockets) {
            delete this.sockets[socket.uuid];
        }
        this.cb_obj.SocketClose(socket, cb_param);
    }
}

exports.MoneysocketSocket = MoneysocketSocket;
exports.MoneysocketInterconnect = MoneysocketInterconnect;

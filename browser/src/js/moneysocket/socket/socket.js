// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;

const MoneysocketCrypt = require('../core/message/crypt.js').MoneysocketCrypt;

class MoneysocketSocket {
    constructor(initiate_cb_obj) {
        this.uuid = Uuid.uuidv4();
        this.msg_recv_cb_obj = null;
        console.assert(typeof initiate_cb_obj.initiateClose == 'function');
        console.assert(typeof initiate_cb_obj.initiateSend == 'function');
        this.initiate_cb_obj = initiate_cb_obj;
        this.shared_seed = null;
    }

    toString() {
        return "<socket uuid=" + this.uuid + ">";
    }

    //////////////////////////////////////////////////////////////////////////

    registerRecvCbObj(cb_obj) {
        console.assert(typeof cb_obj.msgRecvCb == 'function');
        this.msg_recv_cb_obj = cb_obj;
    }

    registerSharedSeed(shared_seed) {
        this.shared_seed = shared_seed;
    }

    //////////////////////////////////////////////////////////////////////////


    close() {
        this.initiate_cb_obj.initiateClose();
    }

    write(msg) {
        var msg_bytes = MoneysocketCrypt.wireEncode(msg, this.shared_seed);
        this.initiate_cb_obj.initiateSend(msg_bytes);
    }

    msgRecv(msg_bytes) {
        // TODO wire decode
        if (this.msg_recv_cb_obj == null) {
            console.error("no recv callback registered!");
            return;
        }

        console.log("rec msg_bytes" + msg_bytes);
        if (MoneysocketCrypt.isCyphertext(msg_bytes) &&
            (this.shared_seed == null))
        {
            console.error("could not interpret message bytes");
            return;
        }
        console.log("msg_bytes len: " + msg_bytes.length);

        var [msg, err] = MoneysocketCrypt.wireDecode(msg_bytes,
                                                     this.shared_seed);
        if (err != null) {
            console.error("got bad message? " + err);
            return;
        }
        this.msg_recv_cb_obj.msgRecvCb(this, msg);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Interconnect
///////////////////////////////////////////////////////////////////////////////

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

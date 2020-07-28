// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require('./request.js').MoneysocketRequest;

let REQUEST_SUBCLASSES = require('./request.js').REQUEST_SUBCLASSES;


class RequestPing extends MoneysocketRequest {
    constructor() {
        super("REQUEST_PING");
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestPing();
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        return null;
    }
}

REQUEST_SUBCLASSES['REQUEST_PING'] = RequestPing;

exports.RequestPing = RequestPing;

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require('./request.js').MoneysocketRequest;
const Uuid = require('../../../utl/uuid.js').Uuid;
const BinUtl = require('../../../utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require('./request.js').REQUEST_SUBCLASSES;


class RequestPay extends MoneysocketRequest {
    constructor(bolt11) {
        super("REQUEST_PAY");
        this.bolt11 = bolt11;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestPay(msg_dict['bolt11']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('bolt11' in msg_dict)) {
            return "no bolt11 included";
        }
        if (typeof msg_dict['bolt11'] != 'string') {
            return "unknown bolt11 type";
        }
        // TODO full parse to make sure it includes amount
        if (! msg_dict['bolt11'].startsWith('lnbc')) {
            return "doesn't look like a bolt11";
        }
        return null;
    }

}

REQUEST_SUBCLASSES['REQUEST_PAY'] = RequestPay;

exports.RequestPay = RequestPay;

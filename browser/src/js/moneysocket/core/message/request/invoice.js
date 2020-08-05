// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require('./request.js').MoneysocketRequest;
const Uuid = require('../../../utl/uuid.js').Uuid;
const BinUtl = require('../../../utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require('./request.js').REQUEST_SUBCLASSES;


class RequestInvoice extends MoneysocketRequest {
    constructor(msats) {
        super("REQUEST_INVOICE");
        this.msats = msats;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestInvoice(msg_dict['msats']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('msats' in msg_dict)) {
            return "no msats included";
        }
        if (typeof msg_dict['msats'] != 'number') {
            return "unknown msats type";
        }
        if (msg_dict['msats'] <= 0) {
            return "msats must be a positive non-zero value";
        }
        return null;
    }

}

REQUEST_SUBCLASSES['REQUEST_INVOICE'] = RequestInvoice;

exports.RequestInvoice = RequestInvoice;

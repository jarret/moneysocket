// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require('./request.js').MoneysocketRequest;
const Uuid = require('../../../utl/uuid.js').Uuid;
const BinUtl = require('../../../utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require('./request.js').REQUEST_SUBCLASSES;


class RequestRendezvous extends MoneysocketRequest {
    constructor(rendezvous_id) {
        super("REQUEST_RENDEZVOUS");
        this.rendezvous_id = rendezvous_id;
    }

    cryptLevel() {
        return "CLEAR";
    }

    static castClass(msg_dict) {
        var c = new RequestRendezvous(msg_dict['rendezvous_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('rendezvous_id' in msg_dict)) {
            return "no rendezvous_id included";
        }
        if (typeof msg_dict['rendezvous_id'] != 'string') {
            return "unknown rendezvous_id type";
        }
        if (! BinUtl.stringIsHex(msg_dict['rendezvous_id'])) {
            return "rendezvous_id not hex string";
        }
        if (msg_dict['rendezvous_id'].length != 64) {
            return "rendezvous_id not 256-bit value hex string";
        }
        return null;
    }

}

REQUEST_SUBCLASSES['REQUEST_RENDEZVOUS'] = RequestRendezvous;

exports.RequestRendezvous = RequestRendezvous;

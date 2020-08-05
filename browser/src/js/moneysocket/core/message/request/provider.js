// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require('./request.js').MoneysocketRequest;
const Uuid = require('../../../utl/uuid.js').Uuid;
const BinUtl = require('../../../utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require('./request.js').REQUEST_SUBCLASSES;


class RequestProvider extends MoneysocketRequest {
    constructor() {
        super("REQUEST_PROVIDER");
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestProvider();
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        return null;
    }

}

REQUEST_SUBCLASSES['REQUEST_PROVIDER'] = RequestProvider;

exports.RequestProvider = RequestProvider;

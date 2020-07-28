// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketMessage = require('../message.js').MoneysocketMessage;
const Uuid = require('../../../utl/uuid.js').Uuid;

let MESSAGE_SUBCLASSES = require('../message.js').MESSAGE_SUBCLASSES;

let REQUEST_SUBCLASSES = {};

class MoneysocketRequest extends MoneysocketMessage {
    constructor(request_name) {
        super("REQUEST");
        this.request_uuid = Uuid.uuidv4();
        this.request_name = request_name;
    }

    static castClass(msg_dict) {
        var request_class = REQUEST_SUBCLASSES[msg_dict['request_name']];
        return request_class.castClass(msg_dict);
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('request_uuid' in msg_dict)) {
            return "no request_uuid included";
        }
        if (typeof msg_dict['request_uuid'] != 'string') {
            return "unknown request_uuid type";
        }
        if (! Uuid.isUuid(msg_dict['request_uuid'])) {
            return "invalid request_uuid";
        }
        if (! ('request_name' in msg_dict)) {
            return "invalid request_name";
        }
        if (typeof msg_dict['request_name'] != 'string') {
            return "unknown request_name type";
        }
        if (! (msg_dict['request_name'] in REQUEST_SUBCLASSES)) {
            return "unknown request_name: " + msg_dict['request_name'];
        }

        var subclass = REQUEST_SUBCLASSES[msg_dict['request_name']];
        return subclass.checkValidMsgDict(msg_dict);
    }
}


MESSAGE_SUBCLASSES['REQUEST'] = MoneysocketRequest;

exports.MoneysocketRequest = MoneysocketRequest;
exports.REQUEST_SUBCLASSES = REQUEST_SUBCLASSES;

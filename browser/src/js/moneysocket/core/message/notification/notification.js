// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketMessage = require('../message.js').MoneysocketMessage;
const Uuid = require('../../../utl/uuid.js').Uuid;

let MESSAGE_SUBCLASSES = require('../message.js').MESSAGE_SUBCLASSES;

let NOTIFICATION_SUBCLASSES = {};

class MoneysocketNotification extends MoneysocketMessage {
    constructor(notification_name, request_reference_uuid) {
        super("NOTIFICATION");
        this.notification_uuid = Uuid.uuidv4();
        this.request_reference_uuid = request_reference_uuid;
        this.notification_name = notification_name;
    }

    static castClass(msg_dict) {
        var notification_class = NOTIFICATION_SUBCLASSES[
            msg_dict['notification_name']];
        return notification_class.castClass(msg_dict);
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('notification_uuid' in msg_dict)) {
            return "no notification_uuid included";
        }
        if (typeof msg_dict['notification_uuid'] != 'string') {
            return "unknown notification_uuid type";
        }
        if (! Uuid.isUuid(msg_dict['notification_uuid'])) {
            return "invalid notification_uuid";
        }

        if (! ('request_reference_uuid' in msg_dict)) {
            return "no request_reference_uuid included";
        }
        if (msg_dict['request_reference_uuid'] != null) {
            if (typeof msg_dict['request_reference_uuid'] != 'string') {
                return "unknown request_reference_uuid type";
            }
            if (! Uuid.isUuid(msg_dict['request_reference_uuid'])) {
                return "invalid request_reference_uuid";
            }
        }

        if (! ('notification_name' in msg_dict)) {
            return "invalid notification_name";
        }
        if (typeof msg_dict['notification_name'] != 'string') {
            return "unknown notification_name type";
        }
        if (! (msg_dict['notification_name'] in NOTIFICATION_SUBCLASSES)) {
            return ("unknown notification_name: "  +
                    msg_dict['notification_name']);
        }

        var subclass = NOTIFICATION_SUBCLASSES[msg_dict['notification_name']];
        return subclass.checkValidMsgDict(msg_dict);

    }

}


MESSAGE_SUBCLASSES['NOTIFICATION'] = MoneysocketNotification;

exports.MoneysocketNotification = MoneysocketNotification;
exports.NOTIFICATION_SUBCLASSES = NOTIFICATION_SUBCLASSES;

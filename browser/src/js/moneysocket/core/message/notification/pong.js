// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;


class NotifyPong extends MoneysocketNotification {
    constructor(request_reference_uuid) {
        super("NOTIFY_PONG", request_reference_uuid);
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyPong(msg_dict['request_reference_uuid']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_PONG'] = NotifyPong;

exports.NotifyPong = NotifyPong;

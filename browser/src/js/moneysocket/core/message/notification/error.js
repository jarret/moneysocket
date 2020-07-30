// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyError extends MoneysocketNotification {
    constructor(error_msg, request_reference_uuid) {
        super("NOTIFY_ERROR", request_reference_uuid);
        this.error_msg = error_msg;
    }

    cryptLevel() {
        return "CLEAR";
    }

    static castClass(msg_dict) {
        var c = new NotifyError(msg_dict['err_msg'],
                                msg_dict['request_reference_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('error_msg' in msg_dict)) {
            return "no error_msg included";
        }
        if (typeof msg_dict['error_msg'] != 'string') {
            return "unknown error_msg type";
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_ERROR'] = NotifyError;

exports.NotifyError = NotifyError;

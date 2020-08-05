// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../../utl/bin.js').BinUtl;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyInvoice extends MoneysocketNotification {
    constructor(bolt11, request_reference_uuid) {
        super("NOTIFY_INVOICE", request_reference_uuid);
        this.bolt11 = bolt11;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyInvoice(msg_dict['bolt11'],
                                  msg_dict['request_reference_id']);
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

NOTIFICATION_SUBCLASSES['NOTIFY_INVOICE'] = NotifyInvoice;

exports.NotifyInvoice = NotifyInvoice;

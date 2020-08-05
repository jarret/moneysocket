// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../../utl/bin.js').BinUtl;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyPreimage extends MoneysocketNotification {
    constructor(preimage, ext, request_reference_uuid) {
        super("NOTIFY_PREIMAGE", request_reference_uuid);
        this.preimage = preimage;
        this.ext = ext
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyPreimage(msg_dict['bolt11'],
                                   msg_dict['ext'],
                                   msg_dict['request_reference_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('preimage' in msg_dict)) {
            return "no preimage included";
        }
        if (typeof msg_dict['preimage'] != 'string') {
            return "unknown preimage type";
        }
        if (! BinUtl.stringIsHex(msg_dict['preimage'])) {
            return "preimage not hex string";
        }
        if (msg_dict['preimage'].length != 64) {
            return "preimage not 256-bit value hex string";
        }
        if (msg_dict['ext'] != null) {
            if (typeof msg_dict['ext'] != 'string') {
                return "unknown ext field type";
            }
            if (msg_dict['ext'].length > 4096) {
                return "ext is longer than 4096 characters";
            }
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_PREIMAGE'] = NotifyPreimage;

exports.NotifyPreimage = NotifyPreimage;

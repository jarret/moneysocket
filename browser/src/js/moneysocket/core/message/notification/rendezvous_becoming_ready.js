// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../../utl/bin.js').BinUtl;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyRendezvousBecomingReady extends MoneysocketNotification {
    constructor(rendezvous_id, request_reference_uuid) {
        super("NOTIFY_RENDEZVOUS_BECOMING_READY", request_reference_uuid);
        this.rendezvous_id = rendezvous_id;
    }

    cryptLevel() {
        return "CLEAR";
    }

    static castClass(msg_dict) {
        var c = new NotifyRendezvousBecomingReady(
            msg_dict['rendezvous_id'], msg_dict['request_reference_id']);
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

NOTIFICATION_SUBCLASSES['NOTIFY_RENDEZVOUS_BECOMING_READY'] = (
    NotifyRendezvousBecomingReady);

exports.NotifyRendezvousBecomingReady = NotifyRendezvousBecomingReady;

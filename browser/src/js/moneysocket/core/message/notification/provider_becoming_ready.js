// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../../utl/bin.js').BinUtl;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyProviderBecomingReady extends MoneysocketNotification {
    constructor(request_reference_uuid) {
        super("NOTIFY_PROVIDER_BECOMING_READY", request_reference_uuid);
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyProviderBecomingReady(
            msg_dict['request_reference_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_PROVIDER_BECOMING_READY'] = (
    NotifyProviderBecomingReady);

exports.NotifyProviderBecomingReady = NotifyProviderBecomingReady;

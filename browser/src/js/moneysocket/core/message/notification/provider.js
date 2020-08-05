// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../../utl/bin.js').BinUtl;
const Uuid = require('../../../utl/uuid.js').Uuid;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyProvider extends MoneysocketNotification {
    constructor(provider_uuid, request_reference_uuid, payer, payee, msats) {
        super("NOTIFY_PROVIDER", request_reference_uuid);
        this.provider_uuid = provider_uuid;
        this.payer = payer
        this.payee = payee
        this.msats = msats
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyProvider(msg_dict['provider_uuid'],
                                   msg_dict['request_reference_id'],
                                   msg_dict['payer'], msg_dict['payee'],
                                   msg_dict['msats']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if ( !('provider_uuid' in msg_dict)) {
            return "no provider_uuid included";
        }
        if (typeof msg_dict['provider_uuid'] != 'string') {
            return "unknown provider_uuid type";
        }
        if (! Uuid.isUuid(msg_dict['provider_uuid'])) {
            return "invalid provider_uuid";
        }
        if (typeof msg_dict['payee'] != "boolean") {
            return "payee must be True or False";
        }
        if (typeof msg_dict['payer'] != "boolean") {
            return "payer must be True or False";
        }
        if (msg_dict['msats'] != null) {
            if (typeof msg_dict['msats'] != 'number') {
                return "msats must be an integer";
            }
            if (msg_dict['msats'] < 0) {
                return "msats must be a positive value";
            }
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_PROVIDER'] = NotifyProvider;

exports.NotifyProvider = NotifyProvider;

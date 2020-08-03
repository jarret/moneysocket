// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../../utl/timestamp.js').Timestamp;

const PROTOCOL = "Moneysocket";

const VERSION_MAJOR = 0;
const VERSION_MINOR = 0;
const VERSION_RELEASE = 0;

const VERSION = (VERSION_MAJOR.toString() + "." +
                 VERSION_MINOR.toString() + "." +
                 VERSION_RELEASE.toString());

let MESSAGE_SUBCLASSES = {};

class MoneysocketMessage {

    constructor(message_class) {
        this.timestamp = Timestamp.getNowTimestamp();
        this.protocol = PROTOCOL;
        this.protocol_version = VERSION;
        this.message_class = message_class;
    }

    toJson() {
        return JSON.stringify(this);
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var message_class = MESSAGE_SUBCLASSES[msg_dict['message_class']];
        return message_class.castClass(msg_dict);
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('message_class' in msg_dict)) {
            return "no message_class included";
        }
        if (typeof msg_dict['message_class'] != 'string') {
            return "unknown message_class type";
        }
        if (! (msg_dict['message_class'] in MESSAGE_SUBCLASSES)) {
            return "not a known message";
        }
        if (! ('timestamp' in msg_dict)) {
            return "no timestamp included";
        }
        if (! (Timestamp.isTimestamp(msg_dict['timestamp']))) {
            return "could not understand timestamp";
        }
        if (! ('protocol' in msg_dict)) {
            return "no timestamp included";
        }
        if (typeof msg_dict['protocol'] != 'string') {
            return "unknown protocol type";
        }
        if (msg_dict['protocol'] != PROTOCOL) {
            return "unknown protocol";
        }
        if (! ('protocol_version' in msg_dict) ) {
            return "no protocol_version declared";
        }
        if (typeof msg_dict['protocol_version'] != 'string') {
            return "unknown protocol type";
        }
        // TODO determine version compatibility?

        var subclass = MESSAGE_SUBCLASSES[msg_dict['message_class']];
        return subclass.checkValidMsgDict(msg_dict)
    }

    static fromText(msg_text) {
        return MoneysocketMessage.castClass(msg_dict), null;
    }

}


exports.MoneysocketMessage = MoneysocketMessage;
exports.MESSAGE_SUBCLASSES = MESSAGE_SUBCLASSES;

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketMessage = require('./message.js').MoneysocketMessage;

/* require to trigger registration of SUBCLASSES dictionaries */
const RequestReceiver = require('./request/receiver.js').RequestReceiver;
const NotificationReceiver = require(
    './notification/receiver.js').NotificationReceiver;

class MessageReceiver {
    static decodeJson(msg_txt) {
        var msg_dict;
        // console.log("decodejson txt : " + msg_txt);
        try {
            msg_dict = JSON.parse(msg_txt);
        } catch (err) {
            console.log("decodejson: " + err);
            return null;
        }
        return msg_dict;
    }

    static fromText(msg_txt) {
        var msg_dict = MessageReceiver.decodeJson(msg_txt);

        if (msg_dict == null) {
            return [null, "could not parse json"];
        }
        var err = MoneysocketMessage.checkValidMsgDict(msg_dict);
        if (err != null) {
            return [null, err];
        }
        return [MoneysocketMessage.castClass(msg_dict), null];
    }
}


exports.MessageReceiver = MessageReceiver;

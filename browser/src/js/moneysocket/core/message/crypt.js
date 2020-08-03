// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

var aesjs = require("aes-js");
const Crypto = require('crypto');

const BinUtl = require('../../utl/bin.js').BinUtl;
const StringUtl = require('../../utl/string.js').StringUtl;

const MessageReceiver = require("./receiver.js").MessageReceiver;

class MoneysocketCrypt {

    static isClear(msg_bytes) {
        //console.log("checking clear: " + msg_bytes);
        try {
            var msg_txt = StringUtl.fromUtf8(msg_bytes);
            var msg_dict = JSON.parse(msg_txt);
        } catch (err) {
            //console.log("err: " + err);
            return false;
        }
        return true;
    }
    static isCyphertext(msg_bytes) {
        return ! MoneysocketCrypt.isClear(msg_bytes);
    }

    static pad(msg_bytes) {
        var pad_bytes = 16 - (msg_bytes.length % 16)
        var pad = new Uint8Array(pad_bytes);
        return BinUtl.arrayConcat(msg_bytes, pad);
    }

    static unpad(msg_bytes) {
        var i = msg_bytes.length - 1;
        while (msg_bytes[i] == 0) {
            i--;
        }
        return msg_bytes.slice(0, i + 1);
    }


    static encrypt(msg_bytes, shared_seed) {
        msg_bytes = MoneysocketCrypt.pad(msg_bytes);
        var key = shared_seed.deriveAes256Key();
        var iv = Crypto.randomBytes(16);
        var cbc = new aesjs.ModeOfOperation.cbc(key, iv);
        var encrypted = cbc.encrypt(msg_bytes);
        return BinUtl.arrayConcat(iv, encrypted);
    }

    static decrypt(msg_bytes, shared_seed) {
        var key = shared_seed.deriveAes256Key();
        var iv = msg_bytes.slice(0, 16);
        var cbc = new aesjs.ModeOfOperation.cbc(key, iv);
        var decrypted = cbc.decrypt(msg_bytes.slice(16));
        var unpadded = MoneysocketCrypt.unpad(decrypted);
        return unpadded;
    }

    static wireEncode(msg, shared_seed) {
        var msg_bytes = StringUtl.toUtf8(msg.toJson());
        if (msg.cryptLevel() == "CLEAR") {
            return msg_bytes;
        }
        if (shared_seed == null) {
            return msg_bytes;
        }
        return MoneysocketCrypt.encrypt(msg_bytes, shared_seed);
    }

    static wireDecode(msg_bytes, shared_seed) {
        //console.log("wire decode: " + msg_bytes);
        var is_cyphertext = MoneysocketCrypt.isCyphertext(msg_bytes);
        if (is_cyphertext && shared_seed == null) {
            return [null, "no seed to decrypt cyphertext"];
        }

        if (is_cyphertext) {
            var cleartext = MoneysocketCrypt.decrypt(msg_bytes, shared_seed);
            var msg_txt;
            try {
                msg_txt = StringUtl.fromUtf8(cleartext);
            } catch {
                return [null, "message did not decode to utf8"];
            }
            var [msg, err] = MessageReceiver.fromText(msg_txt);
            if (err != null) {
                console.log("fromtext err " + err);
                return [null, err];
            }
            if (msg.cryptLevel() == "CLEAR") {
                return [null, "got encrypted msg that should have been clear"];
            }
            return [msg, null];
        } else {
            var msg_txt;
            try {
                msg_txt = StringUtl.fromUtf8(msg_bytes);
            } catch {
                return [null, "message did not decode to utf8"];
            }
            var [msg, err] = MessageReceiver.fromText(msg_txt);
            if (err != null) {
                return [null, err];
            }
            if (msg.cryptLevel() != "CLEAR") {
                return [null, "got clear msg that should have been encrypted"];
            }
            return [msg, null];
        }
    }

}


exports.MoneysocketCrypt = MoneysocketCrypt;

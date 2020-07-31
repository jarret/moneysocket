// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

// For encoding/decoding values to/from Tlv (Type-Length-Value) byte strings
// as defined in:
// https://github.com/lightningnetwork/lightning-rfc/blob/master/01-messaging.md#type-length-value-format


const BinUtl = require('../bin.js').BinUtl;
const BigSize = require('./bigsize.js').BigSize;

class Tlv {
    constructor(t, v) {
        this.t = t;
        this.l = v.length;
        this.v = v;
    }

    toString() {
        return "(" + this.t + "," + this.l + "," + BinUtl.b2h(this.v) + ")";
    }

    static peek(byte_array) {
        var [t, remainder, err] = BigSize.pop(byte_array);
        if (err != null) {
            return [null, "could not get type: " + err];
        }
        var [l, remainder, err] = BigSize.pop(remainder);
        if (err != null) {
            return [null, "could not get length: " + err];
        }
        if (remainder.length < l) {
            return [null, "value truncated"];
        }
        return [new Tlv(t, remainder.slice(0, l)), null];
    }

    static pop(byte_array) {
        var [t, remainder, err] = BigSize.pop(byte_array);
        if (err != null) {
            return [null, null, "could not get type: " + err];
        }
        var [l, remainder, err] = BigSize.pop(remainder);
        if (err != null) {
            return [null, null, "could not get length: " + err];
        }
        if (remainder.length < l) {
            return [null, null, "value truncated"];
        }
        return [new Tlv(t, remainder.slice(0, l)), remainder.slice(l), null];
    }

    encode() {
        var t_encoded = BigSize.encode(this.t);
        var l_encoded = BigSize.encode(this.l);
        return BinUtl.arrayConcat(BinUtl.arrayConcat(t_encoded, l_encoded),
                                  this.v);
    }

    static tlvsAreValid(byte_array) {
        while (byte_array.length > 0) {
            var [tlv, byte_array, err] = Tlv.pop(byte_array);
            if (err != null)
                return false;
        }
        return true;
    }

    static decodeTlvs(byte_array) {
        var tlvs = [];
        while (byte_array.length > 0) {
            var [tlv, byte_array, err] = Tlv.pop(byte_array);
            tlvs.push(tlv);
        }
        return tlvs;
    }
}

exports.Tlv = Tlv;

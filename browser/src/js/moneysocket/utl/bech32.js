// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const bech32 = require('bech32');

const BECH32_LIMIT = 20000;

class Bech32 {
    static encodeBytes(bytes, hrp) {
        var words = bech32.toWords(bytes);
        return bech32.encode(hrp, words, BECH32_LIMIT);
    }

    static decodeBytes(bech32_str) {
        var d;
        try {
            d = bech32.decode(bech32_str, BECH32_LIMIT);
        } catch(err) {
            return [null, null];
        }

        var words = d.words;
        var hrp = d.prefix;

        var bytes;
        try {
            bytes = bech32.fromWords(words);
        } catch(err) {
            return [null, null];
        }
        return [hrp, bytes];
    }
}

exports.Bech32 = Bech32;

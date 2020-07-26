// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Crypto = require('crypto');

function toByteArray(hexString) {
    var result = [];
    for (var i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
}

function toHexString(byteArray) {
    return Array.prototype.map.call(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

const SHARED_SEED_LEN = 16;

class SharedSeed {
    constructor(seed_bytes) {
        if (seed_bytes == null) {
            this.seed_bytes = Crypto.randomBytes(SHARED_SEED_LEN);
        } else {
            this.seed_bytes = seed_bytes;
        }
    }

    static FromHexStr(hex_str) {
        if (hex_str.length != SHARED_SEED_LEN * 2) {
            return null;
        }
        return new SharedSeed(toByteArray(hex_str));
    }

    ToString() {
        return toHexString(this.seed_bytes);
    }

    GetBytes() {
        return this.seed_bytes;
    }

    Sha256(input_bytes) {
        const hash = Crypto.createHash('sha256');

        hash.update(input_bytes);
        return hash.digest();
    }

    DoubleSha256(input_bytes) {
        return this.Sha256(this.Sha256(input_bytes));
    }

    DeriveAes256Key() {
        return this.DoubleSha256(this.seed_bytes);
    }

    DeriveRendezvousId() {
        var aes256_key = this.DeriveAes256Key();
        return this.DoubleSha256(aes256_key);
    }
}

exports.SharedSeed = SharedSeed;

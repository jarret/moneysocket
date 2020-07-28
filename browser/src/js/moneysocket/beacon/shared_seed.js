// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Crypto = require('crypto');
const BinUtl = require('../utl/bin.js').BinUtl;

const SHARED_SEED_LEN = 16;

class SharedSeed {
    constructor(seed_bytes) {
        if (seed_bytes == null) {
            this.seed_bytes = Crypto.randomBytes(SHARED_SEED_LEN);
        } else {
            this.seed_bytes = seed_bytes;
        }
    }

    static fromHexStr(hex_str) {
        if (hex_str.length != SHARED_SEED_LEN * 2) {
            return null;
        }
        return new SharedSeed(BinUtl.toByteArray(hex_str));
    }

    toString() {
        return BinUtl.toHexString(this.seed_bytes);
    }

    getBytes() {
        return this.seed_bytes;
    }

    sha256(input_bytes) {
        const hash = Crypto.createHash('sha256');

        hash.update(input_bytes);
        return hash.digest();
    }

    doubleSha256(input_bytes) {
        return this.sha256(this.sha256(input_bytes));
    }

    deriveAes256Key() {
        return this.doubleSha256(this.seed_bytes);
    }

    deriveRendezvousId() {
        var aes256_key = this.deriveAes256Key();
        return this.doubleSha256(aes256_key);
    }

    deriveRendezvousIdHex() {
        return BinUtl.b2h(this.deriveRendezvousId());
    }
}

exports.SharedSeed = SharedSeed;

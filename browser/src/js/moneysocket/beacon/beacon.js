// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const SharedSeed = require('./shared_seed.js').SharedSeed;
const Bech32 = require('../utl/bech32.js').Bech32;
const BinUtl = require('../utl/bin.js').BinUtl;

const BEACON_HRP = "moneysocket";

class MoneysocketBeacon {
    constructor(shared_seed) {
        if (shared_seed != null) {
            this.shared_seed = shared_seed;
        } else {
            this.shared_seed = SharedSeed();
        }
        this.locations = [];
    }

    ToDict() {
        return {'shared_seed': BinUtl.ToHexString(this.shared_seed.GetBytes()),
                'locations':   this.locations}
    }

    EncodeTlvs() {
        // TODO encode locations
        return this.shared_seed.GetBytes();
    }


    ToBech32Str() {
        var encoded_bytes = this.EncodeTlvs();
        return Bech32.EncodeBytes(encoded_bytes, BEACON_HRP);
    }

    static FromBech32Str(beacon_str) {
        var [hrp, bytes] = Bech32.DecodeBytes(beacon_str);

        if (hrp != BEACON_HRP) {
            return [null, "got unexpected hrp"];
        }
        console.log("data: " + BinUtl.ToHexString(bytes));

        // TODO decode locations

        var beacon = new MoneysocketBeacon(new SharedSeed(bytes));
        return [beacon, null];
    }
}


exports.MoneysocketBeacon = MoneysocketBeacon;

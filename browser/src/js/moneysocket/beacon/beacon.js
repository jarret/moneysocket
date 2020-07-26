// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const SharedSeed = require('./shared_seed.js').SharedSeed;

class MoneysocketBeacon {
    constructor(shared_seed) {
        if (shared_seed != null) {
            this.shared_seed = shared_seed;
        } else {
            this.shared_seed = SharedSeed();
        }
    }
}


exports.MoneysocketBeacon = MoneysocketBeacon;

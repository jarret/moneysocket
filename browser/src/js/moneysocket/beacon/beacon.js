// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const SharedSeed = require('./shared_seed.js').SharedSeed;
const Bech32 = require('../utl/bech32.js').Bech32;
const BinUtl = require('../utl/bin.js').BinUtl;

const Tlv = require('../utl/bolt/tlv.js').Tlv;
const BigSize = require('../utl/bolt/bigsize.js').BigSize;

const WebsocketLocation = require('./location/websocket.js').WebsocketLocation;
const WebRtcLocation = require('./location/webrtc.js').WebRtcLocation;
const BluetoothLocation = require('./location/bluetooth.js').BluetoothLocation;
const NfcLocation = require('./location/nfc.js').NfcLocation;



/* According to BOLT 1, extension TLVs must be greater than 2^16. Odd types
 * allow the TLV to be ignored if it isn't understood.  This starting value is
 * chosen to be 2^16 + 443 and will increment by 2 to define these 'type'
 * values
 */

const TLV_TYPE_START = 65979;


/* Set up the 'Type' integer value for the needed fields.  These values need to
 * be standardized and stable and hopefully recognized by the larger LN
 * ecosystem and hopefully officially defined in BOLT. Lower 'official' integer
 * values would also slightly improve the encoded byte size
 *
 * Also, wondering if a block of 'reserved' values makes sense for later
 * extensions.
 */

const BEACON_TLV_TYPE = TLV_TYPE_START;
const SHARED_SEED_TLV_TYPE = TLV_TYPE_START + 2;
const LOCATION_COUNT_TLV_TYPE = TLV_TYPE_START + 4;
const LOCATION_LIST_TLV_TYPE = TLV_TYPE_START + 6;


const WEBSOCKET_LOCATION_TLV_TYPE = TLV_TYPE_START + 8;

// TODO - figure out the data in the WebRTC 'signal' and how to encode it
const WEBRTC_LOCATION_TLV_TYPE = TLV_TYPE_START + 10;

// TODO - does this even make sense for bluetooth? some sort of device ID is
// probably needed.
const BLUETOOTH_LOCATION_TLV_TYPE = TLV_TYPE_START + 12;

// TODO - does this even make sense for nfc? some sort of device ID is probably
// needed.
const NFC_LOCATION_TLV_TYPE = TLV_TYPE_START + 14;


const BEACON_HRP = "moneysocket";

class MoneysocketBeacon {
    constructor(shared_seed) {
        if (shared_seed != null) {
            this.shared_seed = shared_seed;
        } else {
            this.shared_seed = new SharedSeed();
        }
        this.locations = [];
    }

    toString() {
        return this.toBech32Str();
    }

    toDict() {
        var dict_locations = [];
        this.locations.forEach(location => {
            dict_locations.push(location.toDict());
        });
        return {'shared_seed': BinUtl.toHexString(this.shared_seed.getBytes()),
                'locations':   dict_locations}
    }

    ///////////////////////////////////////////////////////////////////////////

    addLocation(location) {
        this.locations.push(location);
    }

    ///////////////////////////////////////////////////////////////////////////

    encodeLocationListTlv() {
        var encoded;
        var location_count = this.locations.length;
        var location_count_encoded = BigSize.encode(location_count);
        var lc_tlv = new Tlv(LOCATION_COUNT_TLV_TYPE, location_count_encoded);
        encoded = lc_tlv.encode();
        this.locations.forEach(location => {
            var location_encoded = location.encodeTlv();
            encoded = BinUtl.arrayConcat(encoded, location_encoded);
        });
        return new Tlv(LOCATION_LIST_TLV_TYPE, encoded).encode();
    }

    encodeTlvs() {
        var ss_encoded = new Tlv(SHARED_SEED_TLV_TYPE,
                                 this.shared_seed.getBytes()).encode();
        var ll_encoded = this.encodeLocationListTlv();
        var encoded = BinUtl.arrayConcat(ss_encoded, ll_encoded);
        return new Tlv(BEACON_TLV_TYPE, encoded).encode();
    }

    ///////////////////////////////////////////////////////////////////////////

    static decodeTlvs(byte_array) {
        var [beacon_tlv, discard, err] = Tlv.pop(byte_array);
        if (err != null) {
            return [null, null, err];
        }
        if (beacon_tlv.t != BEACON_TLV_TYPE) {
            return [null, null, "got unexpected tlv type"];
        }
        var [ss_tlv, remainder, err] = Tlv.pop(beacon_tlv.v);
        if (err != null) {
            return [null, null, err];
        }
        if (ss_tlv.t != SHARED_SEED_TLV_TYPE) {
            return [null, null, "got unexpected shared seed tlv type"];
        }
        var [ll_tlv, remainder, err] = Tlv.pop(remainder)
        if (err != null) {
            return [null, null, err];
        }
        if (ll_tlv.t != LOCATION_LIST_TLV_TYPE) {
            return [null, null, "got unexpected location list tlv type"];
        }
        var shared_seed = new SharedSeed(ss_tlv.v);

        var [lc_tlv, remainder, err] = Tlv.pop(ll_tlv.v);
        if (err != null) {
            return [null, null, err];
        }
        if (lc_tlv.t != LOCATION_COUNT_TLV_TYPE) {
            return [null, null, "got unexpected location count tlv type"];
        }
        var [location_count, discard, err] = BigSize.pop(lc_tlv.v);
        if (err != null) {
            return [null, null, err];
        }
        var locations = [];
        for (var i=0; i < location_count; i++) {
            var [l_tlv, remainder, err] = Tlv.pop(remainder);
            if (err != null) {
                return [null, null, err];
            }
            if (l_tlv.t == WEBSOCKET_LOCATION_TLV_TYPE) {
                var [location, err] = WebsocketLocation.fromTlv(l_tlv);
                if (err != null) {
                    return [null, null, err];
                }
            } else if (l_tlv.t == WEBRTC_LOCATION_TLV_TYPE) {
                var [location, err] = WebRtcLocation.fromTlv(l_tlv);
                if (err != null) {
                    return [null, null, err];
                }
            } else if (l_tlv.t == BLUETOOTH_LOCATION_TLV_TYPE) {
                var [location, err] = BluetoothLocation.fromTlv(l_tlv);
                if (err != null) {
                    return [null, null, err];
                }
            } else if (l_tlv.t == NFC_LOCATION_TLV_TYPE) {
                var [location, err] = NfcLocation.fromTlv(l_tlv);
                if (err != null) {
                    return [null, null, err];
                }
            } else {
                // TODO tolerate this with `continue`?
                return [null, null, "unknown location type"];
            }
            locations.push(location);
        }
        return [shared_seed, locations, null];
    }

    ///////////////////////////////////////////////////////////////////////////

    toBech32Str() {
        var encoded_bytes = this.encodeTlvs();
        return Bech32.encodeBytes(encoded_bytes, BEACON_HRP);
    }

    static fromBech32Str(beacon_str) {
        var [hrp, bytes] = Bech32.decodeBytes(beacon_str);

        if (hrp != BEACON_HRP) {
            return [null, "got unexpected hrp"];
        }
        console.log("data: " + BinUtl.toHexString(bytes));

        var [shared_seed, locations, err] = MoneysocketBeacon.decodeTlvs(bytes);
        if (err != null) {
            return [null, err];
        }
        var beacon = new MoneysocketBeacon(shared_seed);
        console.log("locations: " + locations);
        locations.forEach(location => {
            console.log("adding location");
            beacon.addLocation(location);
        });
        return [beacon, null];
    }
}


exports.MoneysocketBeacon = MoneysocketBeacon;

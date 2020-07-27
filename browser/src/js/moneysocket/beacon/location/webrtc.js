// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BigSize = require('../../utl/bolt/bigsize.js').BigSize;
const Tlv = require('../../utl/bolt/tlv.js').Tlv;
const BinUtl = require('../../utl/bin.js').BinUtl;
const StringUtl = require('../../utl/string.js').StringUtl;


// This must match values in beacon.js
const TLV_TYPE_START = 65979
const WEBRTC_LOCATION_TLV_TYPE = TLV_TYPE_START + 10

const PLACEHOLDER_TLV_TYPE = 0;


class WebRtcLocation {
    constructor(placeholder_string) {
        this.placeholder_string = ((placeholder_string == null) ?
                                    "webrtc herpaderp" : placeholder_string);
    }

    toDict() {
        return {'type':               "WebRTC",
                'placeholder_string': this.placeholder_string,
               };
    }

    static fromTlv(tlv) {
        console.assert(tlv.t == WEBRTC_LOCATION_TLV_TYPE, "wrong tlv type");
        var tlvs = {};
        Tlv.decodeTlvs(tlv.v).forEach(tlv => {
            tlvs[tlv.t] = tlv;
        });
        if (! (PLACEHOLDER_TLV_TYPE in tlvs)) {
            return [null, "no placeholder tlv given"];
        }
        var placeholder_string;
        try {
            placeholder_string = StringUtl.fromUtf8(
                tlvs[PLACEHOLDER_TLV_TYPE].v);
        }
        catch(err) {
            console.log(err);
            return [null, "error decoding placeholder string"];
        }
        return [new WebRtcLocation(placeholder_string), null];
    }

    encodeTlv() {
        var encoded = new Tlv(PLACEHOLDER_TLV_TYPE,
            StringUtl.toUtf8(this.placeholder_string)).encode();
        return new Tlv(WEBRTC_LOCATION_TLV_TYPE, encoded).encode();
    }
}

exports.WebRtcLocation = WebRtcLocation;

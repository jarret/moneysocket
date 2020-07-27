// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BigSize = require('../../utl/bolt/bigsize.js').BigSize;
const Tlv = require('../../utl/bolt/tlv.js').Tlv;
const BinUtl = require('../../utl/bin.js').BinUtl;
const StringUtl = require('../../utl/string.js').StringUtl;



const TLV_TYPE_START = 65979
const WEBSOCKET_LOCATION_TLV_TYPE = TLV_TYPE_START + 8


const HOST_TLV_TYPE = 0;
const USE_TLS_TLV_TYPE = 1;
const USE_TLS_ENUM_VALUE = {0: false,
                            1: true};
const PORT_TLV_TYPE = 2;
const DEFAULT_TLS_PORT = 443;
const DEFAULT_NO_TLS_PORT = 80;

class WebsocketLocation {
    constructor(host, port, use_tls) {
        this.host = host;
        this.use_tls = (use_tls == null) ? true : use_tls;
        this.port = ((port == null) ? (this.use_tls ? DEFAULT_TLS_PORT :
                                                      DEFAULT_NO_TLS_PORT) :
                                       port);
    }

    toDict() {
        return {'type':    "WebSocket",
                'host':    this.host,
                'port':    this.port,
                'use_tls': this.us_tls};
    }

    static fromTlv(tlv) {
        console.assert(tlv.t == WEBSOCKET_LOCATION_TLV_TYPE, "wrong tlv type");
        var tlvs = {};
        Tlv.decodeTlvs(tlv.v).forEach(tlv => {
            tlvs[tlv.t] = tlv;
        });
        if (! (HOST_TLV_TYPE in tlvs)) {
            return [null, "no host tlv given"];
        }
        var host;
        try {
            host = StringUtl.fromUtf8(tlvs[HOST_TLV_TYPE].v);
        }
        catch(err) {
            return [null, "error decoding host string"];
        }
        var use_tls;
        if (! (HOST_TLV_TYPE in tlvs)) {
            use_tls = true;
        } else {
            var [enum_value, remainder, err] = BigSize.pop(
                tlvs[USE_TLS_TLV_TYPE].v);
            if (err != null) {
                return [null, err];
            }
            if (! (enum_value in USE_TLS_ENUM_VALUE)) {
                return [null, "error decoding use_tls setting"];
            }
            use_tls = USE_TLS_ENUM_VALUE[enum_value];
        }
        var port;
        if (! (PORT_TLV_TYPE in tlvs)) {
            port = use_tls ? DEFAULT_TLS_PORT : DEFAULT_NO_TLS_PORT;
        } else {
            var [port, remainder, err] = BigSize.pop(tlvs[PORT_TLV_TYPE].v);
            if (err != null) {
                return [null, err];
            }
        }
        return [new WebsocketLocation(host, port, use_tls), null];
    }

    static encodeTlv() {
        var encoded = Tlv(HOST_TLV_TYPE, StringUtl.toUtf8(host)).encode();

        if (! this.use_tls) {
            encoded += Tlv(USE_TLS_TLV_TYPE, BigSize.encode(0)).encode();
            if (this.port != DEFAULT_NO_TLS_PORT) {
                var encoded_port = Tlv(PORT_TLV_TYPE,
                                       BigSize.encode(this.port)).encode();
                encoded = BinUtl.arrayConcat(encoded, encoded_port);
            }
        } else {
            if (port != DEFAULT_TLS_PORT) {
                var encoded_port = Tlv(PORT_TLV_TYPE,
                                       BigSize.encode(this.port)).encode();
                encoded = BinUtl.arrayConcat(encoded, encoded_port);
            }
        }
        return Tlv(WEBSOCKET_LOCATION_TLV_TYPE, encoded).encode();
    }
}

exports.WebsocketLocation = WebsocketLocation;

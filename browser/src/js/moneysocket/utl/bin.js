// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php
const UInt64 = require('../utl/uint64.js').UInt64;

class BinUtl {

    static stringIsHex(input_string) {
        var re = /[0-9A-Fa-f]{6}/g;
        return (re.test(input_string));
    }

    static toByteArray(hex_string) {
        var result = [];
        for (var i = 0; i < hex_string.length; i += 2) {
            result.push(parseInt(hex_string.substr(i, 2), 16));
        }
        return result;
    }

    static toHexString(byte_array) {
        return Array.prototype.map.call(byte_array, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    static h2b(hex_string) {
        return BinUtl.toByteArray(hex_string);
    }

    static b2h(byte_array) {
        return BinUtl.toHexString(byte_array);
    }

    static i2b(value, n_bytes) {
        console.assert(n_bytes <= 4, "only works up to 32 bit");
        console.assert(value >= 0, "can only encode unsigned integers");
        // integer value to big endian byte array
        // TODO what to do about 64 bit?
        var bytes = new Uint8Array(n_bytes);
        var i = n_bytes;
        do {
            var byte = value & 0xff;
            bytes[--i] = byte;
            value = (value - byte) / 256;
        } while(i);
        return bytes;
    }

    static b2i64(byte_array) {
        console.assert(byte_array.length > 4,
                       "only works for greater than 32bit");
        console.assert(byte_array.length <= 8,
                       "only works for 64 bit values");
        var lo_bytes = byte_array.slice(-4);
        var hi_bytes = byte_array.slice(0, -4);
        var lo = BinUtl.b2i(lo_bytes);
        var hi = BinUtl.b2i(hi_bytes);
        return new UInt64(hi, lo);
    }

    static b2i(byte_array) {
        console.assert(byte_array.length <= 4, "only works up to 32 bit");
        // TODO what to do about 64 bit?
        // big endian byte array to integer value
        var value = 0;
        var i = 0;
        do {
            value = (value * 256) + byte_array[i++];
        } while(i < byte_array.length);
        return value;
    }

    static h2i(hex_string) {
        // big endian hex string to hex value
        return BinUtl.b2i(BinUtl.h2b(hex_string))
    }

    static i2h(value, n_bytes) {
        // integer to big endian hex string
        return BinUtl.b2h(BinUtl.i2b(value, n_bytes))
    }

    static arrayConcat(a, b) {
        var c = new (a.constructor)(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }

    static async blob2Uint8Array(blob) {
        //var p = new Response(blob).arrayBuffer().then(console.log("foof"));
        var p = new Response(blob).arrayBuffer();
        var ab = await p;
        //console.log("ab: " + ab);
        return new Uint8Array(ab);
    }
}


exports.BinUtl = BinUtl;

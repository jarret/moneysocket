// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

class UInt64 {
    constructor(hi, lo) {
        this.hi = hi;
        this.lo = lo;
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
        return UInt64.toByteArray(hex_string);
    }

    static b2h(byte_array) {
        return UInt64.toHexString(byte_array);
    }

    static h2i(hex_string) {
        // big endian hex string to hex value
        return UInt64.b2i(UInt64.h2b(hex_string))
    }

    static i2h(value, n_bytes) {
        // integer to big endian hex string
        return UInt64.b2h(UInt64.i2b(value, n_bytes))
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

    toString() {
        return this.toHex();
    }

    toHex() {
        return UInt64.i2h(this.hi, 4) + UInt64.i2h(this.lo, 4);
    }

    static fromHex(hex_str) {
        var hi;
        var lo;

        console.assert(hex_str.length <= 16, "");
        if (hex_str.length < 8) {
            hi = 0;
            lo = BinUtl.h2i(hex_str);
            return UInt64(hi, lo);
        }
        var lo_str = hex_str.slice(-8);
        var hi_str = hex_str.slice(0, -8);
        //console.log(lo_str);
        //console.log(hi_str);
        return new UInt64(UInt64.h2i(hi_str), UInt64.h2i(lo_str));
    }

    equals(other) {
        return (other.hi == this.hi) && (other.lo == this.lo);
    }
}

exports.UInt64 = UInt64;

// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


class BinUtl {
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
}


exports.BinUtl = BinUtl;

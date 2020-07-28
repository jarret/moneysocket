// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

class StringUtl {
    static toUtf8(string) {
        const te = new TextEncoder("utf-8");
        var byte_array = te.encode(string);
        return byte_array;
    }
    static fromUtf8(byte_array) {
        var a = new Uint8Array(byte_array);
        var decoded = new TextDecoder("utf-8").decode(a);
        return decoded;
    }
}


exports.StringUtl = StringUtl;

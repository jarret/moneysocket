// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

class StringUtl {
    static toUtf8(string) {
        var byte_array = new TextEncoder("utf-8").encode(string);
        return byte_array;
    }
    static fromUtf8(byte_array) {
        var decoded = new TextDecoder("utf-8").decode(byte_array);
        return decoded;
    }
}


exports.StringUtl = StringUtl;

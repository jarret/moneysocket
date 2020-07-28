// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


class Timestamp {
    static getNowTimestamp() {
        return (new Date()).getTime() / 1000;
    }

    static isInt(n) {
        return Number(n) === n && n % 1 === 0;
    }

    static isFloat(n) {
        return Number(n) === n && n % 1 !== 0;
    }

    static isTimestamp(val) {
        var is_val = Timestamp.isInt(val) || Timestamp.isFloat(val);
        return is_val && (val > 0);
    }
}

exports.Timestamp = Timestamp;

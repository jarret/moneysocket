// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BinUtl = require('../bin.js').BinUtl;

/*
For encoding/decoding values to/from BigSize byte strings as defined in:
https://github.com/lightningnetwork/lightning-rfc/blob/master/01-messaging.md#appendix-a-bigsize-test-vectors
*/

class BigSize {

    static peek8(byte_array) {
        if (byte_array.length < 1) {
            return [null, "underrun while peeking a uint8"];
        }
        var slice = byte_array.slice(0, 1)
        console.log("peek8 slice: " + slice);
        return [BinUtl.b2i(slice), null];
    }

    static peek16(byte_array) {
        if (byte_array.length < 2) {
            return [null, "underrun while peeking a uint16"];
        }
        var val = BinUtl.b2i(byte_array.slice(0, 2));
        if (val < 0xfd) {
            return [null, "not a minimally encoded unit16"];
        }
        return [val, null];
    }

    static peek32(byte_array) {
        if (byte_array.length < 4) {
            return [null, "underrun while peeking a uint32"];
        }
        var val = BinUtl.b2i(byte_array.slice(0,4));
        if (val < 0x10000) {
            return [null, "not a minimally encoded uint32"];
        }
        return [val, null];
    }

    static peek64(byte_array) {
        // TODO what to do about 64 bit?
        return [null, "can't deal with 64 bit yet"];
    }

    static peek(byte_array) {
       // Peeks a BigSize off the front of the byte array. The second
       // return value is for passing an error string if there is an error or
       // null otherwise. """
        var [head, err] = BigSize.peek8(byte_array);
        if (err != null) {
            return [null, err];
        }
        if (head == 0xfd) {
            val, err = BigSize.peek16(byte_array);
            if (err != null) {
                return [null, err];
            }
            return [val, null];
        } else if (head == 0xfe) {
            var [val, err] = BigSize.peek32(byte_array);
            if (err != null) {
                return [null, err];
            }
            return [val, null];
        } else if (head == 0xff) {
            val, err = BigSize.peek4(byte_array);
            if (err != null) {
                return [null, err];
            }
            return [val, null];
        }
       return [head, null];
    }

    ///////////////////////////////////////////////////////////////////////////

    static pop8(byte_array) {
        var [val, err] = BigSize.peek8(byte_array);
        if (err != null) {
            return [null, null, err];
        }
        return [val, byte_array.slice(1), null];
    }

    static pop16(byte_array) {
        var [val, err] = BigSize.peek16(byte_array);
        if (err != null) {
            return [null, null, err];
        }
        return [val, byte_array.slice(2), null];
    }

    static pop32(byte_array) {
        var [val, err] = BigSize.peek32(byte_array);
        if (err != null) {
            return [null, null, err];
        }
        return [val, byte_array.slice(4), null];
    }

    static pop64(byte_array) {
        // TODO what to do about 64 bit?
    }

    static pop(byte_array) {
        // Pops a BigSize off the front of the byte array. Returns the
        // decoded value and the remaining byte array. The third return
        // value is for passing an error string if there is an error or null
        // otherwise.
        var [head, byte_array, err] = BigSize.pop8(byte_array);
        if (err != null) {
            return [null, null, err];
        }
        if (head == 0xfd) {
            var [val, byte_array, err] = BigSize.pop16(byte_array);
            if (err != null) {
                return [null, null, err];
            }
            return [val, byte_array, null];
        } else if (head == 0xfe) {
            var [val, byte_array, err] = BigSize.pop32(byte_array);
            if (err != null) {
                return [null, null, err];
            }
            return [val, byte_array, null];
        } else if (head == 0xff) {
            // TODO what to do about 64 bit?
            return [null, null, "whoops, can't deal with 64 bit vals yet"];
        }
        return [head, byte_array, null];
    }

    ///////////////////////////////////////////////////////////////////////////

    static encode(val) {
        console.assert(val <= 0xffffffff, "cannot encode bigger than uint32");
        if (val < 0xfd) {
            return BinUtl.i2b(val, 1);
        }
        if (val < 0x10000) {
            var b1 = BinUtl.i2b(0xfd, 1);
            var b2 = BinUtl.i2b(val, 2);
            return BinUtl.arrayConcat(b1, b2);
        }
        if (val < 0x100000000) {
            var b1 = BinUtl.i2b(0xfe, 1);
            var b2 = BinUtl.i2b(val, 4);
            return BinUtl.arrayConcat(b1, b2);
        }
        // TODO what to do about 64 bit?
        return null;
    }


    static decodeTests() {
        var tests = [
            {
                "name": "zero",
                "value": 0,
                "bytes": "00"
            },
            {
                "name": "one byte high",
                "value": 252,
                "bytes": "fc"
            },
            {
                "name": "two byte low",
                "value": 253,
                "bytes": "fd00fd"
            },
            {
                "name": "two byte high",
                "value": 65535,
                "bytes": "fdffff"
            },
            {
                "name": "four byte low",
                "value": 65536,
                "bytes": "fe00010000"
            },
            {
                "name": "four byte high",
                "value": 4294967295,
                "bytes": "feffffffff"
            },
            {
                "name": "eight byte low",
                "value": 4294967296,
                "bytes": "ff0000000100000000"
            },
            {
                "name": "eight byte high",
                "value": 18446744073709551615,
                "bytes": "ffffffffffffffffff"
            },
            {
                "name": "two byte not canonical",
                "value": 0,
                "bytes": "fd00fc",
                "exp_error": "decoded bigsize is not canonical"
            },
            {
                "name": "four byte not canonical",
                "value": 0,
                "bytes": "fe0000ffff",
                "exp_error": "decoded bigsize is not canonical"
            },
            {
                "name": "eight byte not canonical",
                "value": 0,
                "bytes": "ff00000000ffffffff",
                "exp_error": "decoded bigsize is not canonical"
            },
            {
                "name": "two byte short read",
                "value": 0,
                "bytes": "fd00",
                "exp_error": "unexpected EOF"
            },
            {
                "name": "four byte short read",
                "value": 0,
                "bytes": "feffff",
                "exp_error": "unexpected EOF"
            },
            {
                "name": "eight byte short read",
                "value": 0,
                "bytes": "ffffffffff",
                "exp_error": "unexpected EOF"
            },
            {
                "name": "one byte no read",
                "value": 0,
                "bytes": "",
                "exp_error": "EOF"
            },
            {
                "name": "two byte no read",
                "value": 0,
                "bytes": "fd",
                "exp_error": "unexpected EOF"
            },
            {
                "name": "four byte no read",
                "value": 0,
                "bytes": "fe",
                "exp_error": "unexpected EOF"
            },
            {
                "name": "eight byte no read",
                "value": 0,
                "bytes": "ff",
                "exp_error": "unexpected EOF"
            }
        ];

        tests.forEach(test => {
            console.log(test);
            if (test.bytes.length > 8) {
                console.log("skipping: " + test.bytes);
                return;
            }
            var [value, remainder, err] = BigSize.pop(BinUtl.h2b(test.bytes));
            if (err != null) {
                console.assert('exp_error' in test, "unexpected failure");
                console.log("error reported as: " + err);
                return;
            }
            console.assert(value == test.value,
                           "got unexpected value: " + value);
        });

    }

    static encodeTests() {
        var tests = [
            {
                "name": "zero",
                "value": 0,
                "bytes": "00"
            },
            {
                "name": "one byte high",
                "value": 252,
                "bytes": "fc"
            },
            {
                "name": "two byte low",
                "value": 253,
                "bytes": "fd00fd"
            },
            {
                "name": "two byte high",
                "value": 65535,
                "bytes": "fdffff"
            },
            {
                "name": "four byte low",
                "value": 65536,
                "bytes": "fe00010000"
            },
            {
                "name": "four byte high",
                "value": 4294967295,
                "bytes": "feffffffff"
            },
            {
                "name": "eight byte low",
                "value": 4294967296,
                "bytes": "ff0000000100000000"
            },
            {
                "name": "eight byte high",
                "value": 18446744073709551615,
                "bytes": "ffffffffffffffffff"
            }
        ];

        tests.forEach(test => {
            console.log(test);
            if (test.bytes.length > 8) {
                console.log("skipping: " + test.bytes);
                return;
            }
            var bytes = BigSize.encode(test.value);
            console.assert(BinUtl.b2h(bytes) == test.bytes,
                           "got unexpected bytes: " + bytes);
        });

    }

}

exports.BigSize = BigSize;

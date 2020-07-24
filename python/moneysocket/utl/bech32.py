# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import bitstring
from bech32 import bech32_encode, bech32_decode, convertbits


class Bech32():
    @staticmethod
    def encode_bytes(bytes_to_encode, hrp):
        converted = convertbits(bytes_to_encode, 8, 5, True)
        assert converted
        return bech32_encode(hrp, converted)

    @staticmethod
    def decode_bytes(bech32_string):
        try:
            hrp, data = bech32_decode(bech32_string)
        except:
            return None, None
        if not hrp:
            return None, None
        deconverted = convertbits(data, 5, 8, False)
        assert deconverted
        decoded = bytes(deconverted)
        return hrp, decoded

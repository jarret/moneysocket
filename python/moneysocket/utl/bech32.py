# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import bitstring

from moneysocket.utl.third_party.bech32 import bech32_encode
from moneysocket.utl.third_party.bech32 import bech32_decode

class Bech32():
    @staticmethod
    def bitarray_to_u5(barr):
        assert len(barr) % 5 == 0
        ret = []
        s = bitstring.ConstBitStream(barr)
        while s.pos != s.len:
            ret.append(s.read(5).uint)
        return ret

    @staticmethod
    def u5_to_bitarray(arr):
        ret = bitstring.BitArray()
        for a in arr:
            ret += bitstring.pack("uint:5", a)
        return ret

    @staticmethod
    def encode_bytes(bytes_to_encode, hrp="msbeacon"):
        while len(bytes_to_encode) % 5 != 0:
            bytes_to_encode += b'\0'
        return bech32_encode("ms", Bech32.bitarray_to_u5(bytes_to_encode))

    @staticmethod
    def decode_bytes(bech32_string):
        try:
            hrp, data = bech32_decode(bech32_str)
        except:
            return None, None
        if not hrp:
            return None, None
        decoded = Bech32.u5_to_bitarray(data).bytes
        return hrp, decoded



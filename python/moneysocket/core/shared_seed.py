# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import hashlib
import base64
import bitstring

from moneysocket.utl.lightning_payencode.bech32 import bech32_encode
from moneysocket.utl.lightning_payencode.bech32 import bech32_decode




class SharedSeed():
    def __init__(self, seed_bytes=None):
        self.seed_bytes = (seed_bytes if seed_bytes is not None else
                           os.urandom(16))

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
    def from_string(bech32_str):
        hrp, data = bech32_decode(bech32_str)
        #print("hrp: %s" % hrp)
        #print("data: %s" % data)
        decoded = SharedSeed.u5_to_bitarray(data).bytes[:16]
        #print("decoded: %s" % decoded.hex())
        return SharedSeed(seed_bytes=decoded)

    def __str__(self):
        #print("seed val: %s" % self.seed_bytes.hex())
        seed_bytes = self.seed_bytes
        while len(seed_bytes) % 5 != 0:
            seed_bytes += b'\0'
        return bech32_encode("ms", SharedSeed.bitarray_to_u5(seed_bytes))

    def sha256(self, input_bytes):
        return hashlib.sha256(input_bytes).digest()

    def double_sha256(self, input_bytes):
        return self.sha256(self.sha256(input_bytes))

    def derive_aes256_key(self):
        return self.double_sha256(self.seed_bytes)

    def derive_rendezvous_id(self):
        aes256_key = self.derive_aes256_key()
        return self.double_sha256(aes256_key)



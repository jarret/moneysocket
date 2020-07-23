# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import hashlib
import base64
import bitstring

from moneysocket.utl.bech32 import bech32_encode
from moneysocket.utl.bech32 import bech32_decode




class SharedSeed():
    def __init__(self, seed_bytes=None):
        self.seed_bytes = (seed_bytes if seed_bytes is not None else
                           os.urandom(16))

    @staticmethod
    def from_hex_string(hex_str):
        if len(hex_str) != 32:
            return None
        return SharedSeed(seed_bytes=bytes.fromhex(hex_str))

    def __str__(self):
        return self.seed_bytes.hex()

    def sha256(self, input_bytes):
        return hashlib.sha256(input_bytes).digest()

    def double_sha256(self, input_bytes):
        return self.sha256(self.sha256(input_bytes))

    def derive_aes256_key(self):
        return self.double_sha256(self.seed_bytes)

    def derive_rendezvous_id(self):
        aes256_key = self.derive_aes256_key()
        return self.double_sha256(aes256_key)



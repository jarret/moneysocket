# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import hashlib


class SharedSeed():
    SHARED_SEED_LEN = 16

    def __init__(self, seed_bytes=None):
        self.seed_bytes = (seed_bytes if seed_bytes is not None else
                           os.urandom(SharedSeed.SHARED_SEED_LEN))
        assert len(self.seed_bytes) == SharedSeed.SHARED_SEED_LEN

    @staticmethod
    def from_hex_string(hex_str):
        if len(hex_str) != SharedSeed.SHARED_SEED_LEN * 2:
            return None
        return SharedSeed(seed_bytes=bytes.fromhex(hex_str))

    def __str__(self):
        return self.seed_bytes.hex()

    def get_bytes(self):
        return self.seed_bytes

    def sha256(self, input_bytes):
        return hashlib.sha256(input_bytes).digest()

    def double_sha256(self, input_bytes):
        return self.sha256(self.sha256(input_bytes))

    def derive_aes256_key(self):
        return self.double_sha256(self.seed_bytes)

    def derive_rendezvous_id(self):
        aes256_key = self.derive_aes256_key()
        return self.double_sha256(aes256_key)


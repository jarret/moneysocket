# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


import json
import re

from Crypto.Cipher import AES
from Crypto import Random

from moneysocket.core.message.message import MoneysocketMessage


class MoneysocketCrypt():

    @staticmethod
    def is_clear(msg_bytes):
        try:
            msg_text = msg_bytes.decode("utf8", errors="strict")
            msg_dict = json.loads(msg_text)
        except:
            return False
        return True

    @staticmethod
    def is_cyphertext(msg_bytes):
        return not MoneysocketCrypt.is_clear(msg_bytes)

    @staticmethod
    def pad(msg_bytes):
        print("msg byte len: %d" % len(msg_bytes))
        BLOCK_SIZE = 16
        return msg_bytes + b'\0' * (BLOCK_SIZE - len(msg_bytes) % BLOCK_SIZE)

    @staticmethod
    def unpad(msg_bytes):
        return msg_bytes[:-ord(msg_bytes[len(msg_bytes) - 1:])]

    @staticmethod
    def encrypt(msg_bytes, shared_seed):
        aes256_key = shared_seed.derive_aes256_key()
        raw = MoneysocketCrypt.pad(msg_bytes)
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(aes256_key, AES.MODE_CBC, iv)
        return iv + cipher.encrypt(raw)

    @staticmethod
    def decrypt(msg_bytes, shared_seed):
        aes256_key = shared_seed.derive_aes256_key()
        iv = msg_bytes[:16]
        cipher = AES.new(aes256_key, AES.MODE_CBC, iv)
        decrypted = cipher.decrypt(msg_bytes[16:])
        return re.sub(b'\x00*$', b'', decrypted)

    @staticmethod
    def wire_encode(msg, shared_seed=None):
        msg_bytes = json.dumps(msg).encode("utf8")
        if msg.MUST_BE_CLEARTEXT:
            return msg_bytes
        if shared_seed is None:
            return msg_bytes
        return MoneysocketCrypt.encrypt(msg_bytes, shared_seed)

    @staticmethod
    def wire_decode(msg_bytes, shared_seed=None):
        is_cyphertext = MoneysocketCrypt.is_cyphertext(msg_bytes)
        if is_cyphertext and shared_seed is None:
            return None, "no seed to decrypt cyphertext"

        if is_cyphertext:
            cleartext = MoneysocketCrypt.decrypt(msg_bytes, shared_seed)
            try:
                msg_text = cleartext.decode("utf8", errors="strict")
            except:
                return None, "message did not decode to utf8"

            msg, err = MoneysocketMessage.from_text(msg_text)
            if err:
                return None, err
            if msg.MUST_BE_CLEARTEXT:
                return None, "got encrypted msg which should have been clear"
            return msg, None
        else:
            try:
                msg_text = msg_bytes.decode("utf8", errors="strict")
            except:
                return None, "message did not decode to utf8"

            return MoneysocketMessage.from_text(msg_text)

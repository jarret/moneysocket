# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.utl.third_party.bolt.tlv import Tlv
from moneysocket.utl.third_party.bolt.namespace import Namespace
from moneysocket.utl.third_party.bolt.bigsize import BigSize

PLACEHOLDER_TLV_TYPE = 0

class BluetoothLocation():
    BLUETOOTH_LOCATION_TLV_TYPE = None

    def __init__(self, placeholder_string="bluetooth herpader"):
        self.placeholder_string = placeholder_string

    def to_dict(self):
        return {'type':              "Bluetooth",
                'placeholder_string': self.placeholder_string}
    @staticmethod
    def from_tlv(tlv):
        assert tlv.t == BluetoothLocation.BLUETOOTH_LOCATION_TLV_TYPE
        tlvs = {tlv.t: tlv for tlv in Namespace.iter_tlvs(tlv.v)}
        if PLACEHOLDER_TLV_TYPE not in tlvs.keys():
            return None, "no placeholder tlv given"
        try:
            ps = tlvs[PLACEHOLDER_TLV_TYPE].v.decode("utf8", errors="strict")
        except:
            return None, "error decoding placeholder string"
        return BluetoothLocation(placeholder_string=ps), None

    def encode_tlv(self):
        encoded = Tlv(PLACEHOLDER_TLV_TYPE,
                      self.placeholder_string.encode("utf8")).encode()
        return Tlv(BluetoothLocation.BLUETOOTH_LOCATION_TLV_TYPE,
                   encoded).encode()

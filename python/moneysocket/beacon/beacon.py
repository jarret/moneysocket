# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.utl.third_party.bolt.tlv import Tlv
from moneysocket.utl.third_party.bolt.bigsize import BigSize

from moneysocket.utl.bech32 import Bech32
from moneysocket.beacon.shared_seed import SharedSeed

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.beacon.location.webrtc import WebRtcLocation
from moneysocket.beacon.location.bluetooth import BluetoothLocation
from moneysocket.beacon.location.nfc import NfcLocation


class MoneysocketBeacon():
    BEACON_TLV_TYPE = None
    SHARED_SEED_TLV_TYPE = None
    LOCATION_COUNT_TLV_TYPE = None
    LOCATION_LIST_TLV_TYPE = None

    def __init__(self, shared_seed=None):
        self.shared_seed = shared_seed if shared_seed else SharedSeed()
        self.locations = []

    def __str__(self):
        return self.to_bech32_str()

    def to_dict(self):
        return {'shared_seed': str(self.shared_seed),
                'locations':   [l.to_dict() for l in self.locations]}

    ###########################################################################

    def add_location(self, location):
        self.locations.append(location)

    ###########################################################################

    def encode_location_list_tlv(self):
        encoded = b''
        location_count = len(self.locations)
        location_count_encoded = BigSize.encode(location_count)
        lc_tlv = Tlv(MoneysocketBeacon.LOCATION_COUNT_TLV_TYPE,
                     location_count_encoded).encode()
        encoded += lc_tlv
        for location in self.locations:
            location_encoded = location.encode_tlv()
            encoded += location_encoded
        return Tlv(MoneysocketBeacon.LOCATION_LIST_TLV_TYPE, encoded).encode()

    def encode_tlvs(self):
        ss_encoded = Tlv(MoneysocketBeacon.SHARED_SEED_TLV_TYPE,
                     self.shared_seed.get_bytes()).encode()
        ll_encoded = self.encode_location_list_tlv()
        return Tlv(MoneysocketBeacon.BEACON_TLV_TYPE,
                   ss_encoded + ll_encoded).encode()

    @staticmethod
    def decode_tlvs(tlv_bytes):
        beacon_tlv, _, err = Tlv.pop(tlv_bytes)
        if err:
            return None, None, err

        if beacon_tlv.t != MoneysocketBeacon.BEACON_TLV_TYPE:
            return None, None, "got unexpected tlv type"

        ss_tlv, remainder, err = Tlv.pop(beacon_tlv.v)
        if err:
            return None, None, err

        if ss_tlv.t != MoneysocketBeacon.SHARED_SEED_TLV_TYPE:
            return None, None, "got unexpected shared seed tlv type"

        ll_tlv, remainder, err = Tlv.pop(remainder)
        if err:
            return None, None, err
        if ll_tlv.t != MoneysocketBeacon.LOCATION_LIST_TLV_TYPE:
            return None, None, "got unexpected location list tlv type"

        shared_seed = SharedSeed(seed_bytes=ss_tlv.v)

        lc_tlv, remainder, err = Tlv.pop(ll_tlv.v)
        if err:
            return None, None, err
        if lc_tlv.t != MoneysocketBeacon.LOCATION_COUNT_TLV_TYPE:
            return None, None, "got unexpected location count tlv type"

        location_count, _, err = BigSize.pop(lc_tlv.v)
        if err:
            return None, None, err

        locations = []
        for _ in range(location_count):
            l_tlv, remainder, err = Tlv.pop(remainder)
            if err:
                return None, None, err
            if l_tlv.t == WebsocketLocation.WEBSOCKET_LOCATION_TLV_TYPE:
                location, err = WebsocketLocation.from_tlv(l_tlv)
                if err:
                    return None, None, err
            elif l_tlv.t == WebRtcLocation.WEBRTC_LOCATION_TLV_TYPE:
                location, err = WebRtcLocation.from_tlv(l_tlv)
                if err:
                    return None, None, err
            elif l_tlv.t == BluetoothLocation.BLUETOOTH_LOCATION_TLV_TYPE:
                location, err = BluetoothLocation.from_tlv(l_tlv)
                if err:
                    return None, None, err
            elif l_tlv.t == NfcLocation.NFC_LOCATION_TLV_TYPE:
                location, err = NfcLocation.from_tlv(l_tlv)
                if err:
                    return None, None, err
            else:
                # TODO tolerate this with `continue`?
                return None, None, "unknown location type"
            locations.append(location)

        return shared_seed, locations, None

    ###########################################################################

    def to_bech32_str(self):
        encoded_bytes = self.encode_tlvs()
        return Bech32.encode_bytes(encoded_bytes, "moneysocket")

    @staticmethod
    def from_bech32_str(beacon_str):
        try:
            hrp, decoded_bytes = Bech32.decode_bytes(beacon_str)
        except:
            return None, "could not decode bech32 string"
        if not hrp or not decoded_bytes:
            return None, "could not decode bech32 string"
        if hrp != 'moneysocket':
            return None, "string is not a moneysocket beacon"

        shared_seed, locations, err = MoneysocketBeacon.decode_tlvs(
            decoded_bytes)
        if err:
            return None, err
        mb = MoneysocketBeacon(shared_seed=shared_seed)
        for location in locations:
            mb.add_location(location)
        return mb, None





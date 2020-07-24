# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.beacon.beacon import MoneysocketBeacon

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.beacon.location.webrtc import WebRtcLocation
from moneysocket.beacon.location.bluetooth import BluetoothLocation
from moneysocket.beacon.location.nfc import NfcLocation



# According to BOLT 1, extension TLVs must be greater than 2^16. Odd types
# allow the TLV to be ignored if it isn't understood.
# This starting value is chosen to be 2^16 + 443 and will increment by 2 to
# define these 'type' values

TLV_TYPE_START = 65979


# Set up the 'Type' integer value for the needed fields.
# These values need to be standardized and stable and hopefully recognized
# by the larger LN ecosystem and hopefully officially defined in BOLT. Lower
# 'official' integer values would also slightly improve the encoded byte size

# Also, wondering if a block of 'reserved' values makes sense for later extensions.

MoneysocketBeacon.BEACON_TLV_TYPE = TLV_TYPE_START
MoneysocketBeacon.SHARED_SEED_TLV_TYPE = TLV_TYPE_START + 2
MoneysocketBeacon.LOCATION_COUNT_TLV_TYPE = TLV_TYPE_START + 4
MoneysocketBeacon.LOCATION_LIST_TLV_TYPE = TLV_TYPE_START + 6


WebsocketLocation.WEBSOCKET_LOCATION_TLV_TYPE = TLV_TYPE_START + 8

# TODO - figure out the data in the WebRTC 'signal' and how to encode it
WebRtcLocation.WEBRTC_LOCATION_TLV_TYPE = TLV_TYPE_START + 10

# TODO - does this even make sense for bluetooth? some sort of device ID is
# probably needed.
BluetoothLocation.BLUETOOTH_LOCATION_TLV_TYPE = TLV_TYPE_START + 12

# TODO - does this even make sense for nfc? some sort of device ID is probably
# needed.
NfcLocation.NFC_LOCATION_TLV_TYPE = TLV_TYPE_START + 14


# TODO - what else?

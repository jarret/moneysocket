# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


class Pairing(object):
    def __init__(self):
        self.sockets_waiting_by_uuid = {}
        self.sockets_by_uuid = {}

        self.unpaired_rids_by_uuid = {}
        self.unpaired_uuids_by_rid = {}

        self.pairs_by_uuid = {}
        self.pairs_by_rid = {}

    ###########################################################################

    def _enter_unpaired(self, uuid, rid):
        self.unpaired_uuids_by_rid[rid] = uuid
        self.unpaired_rids_by_uuid[uuid] = rid

    def _exit_unpaired(self, uuid, rid):
        del self.unpaired_uuids_by_rid[rid]
        del self.unpaired_rids_by_uuid[uuid]

    ###########################################################################

    def _enter_paired(self, rid, uuid1, uuid2):
        self.pairs_by_uuid[uuid1] = {'peer_uuid': uuid2,
                                     'rid':       rid}
        self.pairs_by_uuid[uuid2] = {'peer_uuid': uuid1,
                                     'rid':       rid}
        self.pairs_by_rid[rid] = {'uuid1': uuid1,
                                  'uuid2': uuid2}

    def _exit_paired(self, uuid):
        unpaired_uuid = self.pairs_by_uuid[uuid]['peer_uuid']
        unpaired_rid = self.pairs_by_uuid[uuid]['rid']
        del self.pairs_by_uuid[uuid]
        del self.pairs_by_uuid[unpaired_uuid]
        del self.pairs_by_rid[unpaired_rid]
        self._enter_unpaired(unpaired_uuid, unpaired_rid)

    ###########################################################################

    def new_socket(self, socket):
        self.sockets_waiting[socket.uuid] = socket
        self.sockets_by_uuid[socket.uuid] = socket

    def socket_close(self, socket):
        del self.sockets_by_uuid[socket.uuid]
        if socket.uuid in self.sockets_waiting:
            del self.sockets_waiting_by_uuid[socket.uuid]

        if socket.uuid in self.unpaired_rids_by_uuid:
            self._exit_unpaired(socket.uuid)

        if socket.uuid in self.pairs_by_uuid:
            unpaired_uuid = self.pairs_by_uuid[socket_uuid]['peer_uuid']
            self._exit_paired(socket.uuid)
            return "PEER_UNPAIRED", unpaired_uuid
        return "QUIET_CLOSE", None

    ###########################################################################

    def socket_enter_rendezvous(self, rid, socket):
        if rid in self.pairs_by_rid:
            # third entrant can't rendezvous
            return "THIRD", None

        # is there another socket waiting on this rid?
        if rid in self.unpaired_uuids_by_rid:
            # yes, pair them up
            peer_uuid = self.unpaired_uuids_by_rid[rid]
            self.exit_unpaired(peer_uuid, rid)
            self._enter_paired(rid, socket.uuid, peer_uuid)
            return "PAIRED", rid
        # no, wait for pair
        self._enter_unpaired(socket.uuid, rid)
        return "WAITING", rid

    ###########################################################################

    def is_socket_paired(self, uuid):
        return uuid in self.pairs_by_uuid

    def get_paired_socket(self, uuid):
        peer_uuid = self.pairs_by_uuid[uuid]['peer_uuid']
        return self.sockets_by_uuid[peer_uuid]


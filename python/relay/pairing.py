# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


class Pairing(object):
    def __init__(self):
        self.sockets_by_uuid = {}

        self.req_ref_by_uuid = {}

        self.unpaired_rids_by_uuid = {}
        self.unpaired_uuids_by_rid = {}

        self.pairs_by_uuid = {}
        self.pairs_by_rid = {}

    ###########################################################################

    def iter_str_lines(self):
        sockets = len(self.sockets_by_uuid)
        unpaired = len(self.unpaired_rids_by_uuid)
        paired = len(self.pairs_by_uuid)
        yield "----------"
        yield "sockets/unpaired/paired: %d/%d/%d" % (sockets, unpaired, paired)
        yield "relay pairs connected:   %d" % len(self.pairs_by_rid)

    def __str__(self):
        return "\n".join(self.iter_str_lines())

    ###########################################################################

    def _enter_unpaired(self, uuid, rid, req_ref_uuid):
        self.unpaired_uuids_by_rid[rid] = uuid
        self.unpaired_rids_by_uuid[uuid] = rid
        self.req_ref_by_uuid[uuid] = req_ref_uuid

    def _exit_unpaired(self, uuid):
        rid = self.unpaired_rids_by_uuid[uuid]
        del self.unpaired_uuids_by_rid[rid]
        del self.unpaired_rids_by_uuid[uuid]
        del self.req_ref_by_uuid[uuid]

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

    ###########################################################################

    def new_socket(self, socket):
        self.sockets_by_uuid[socket.uuid] = socket

    def socket_close(self, socket):
        del self.sockets_by_uuid[socket.uuid]

        if socket.uuid in self.unpaired_rids_by_uuid:
            self._exit_unpaired(socket.uuid)
            return "QUIET_CLOSE", None, None

        if socket.uuid not in self.pairs_by_uuid:
            return "QUIET_CLOSE", None, None

        unpaired_uuid = self.pairs_by_uuid[socket.uuid]['peer_uuid']
        broken_rid = self.pairs_by_uuid[socket.uuid]['rid']
        self._exit_paired(socket.uuid)
        #self._exit_unpaired(socket.uuid)
        return "RENDEZVOUS_END", unpaired_uuid, broken_rid

    ###########################################################################

    def enter_rendezvous(self, rid, socket, req_ref_uuid):
        if rid in self.pairs_by_rid:
            # third entrant can't rendezvous
            return "THIRD", None, None

        # is there another socket waiting on this rid?
        if rid in self.unpaired_uuids_by_rid:
            # yes, pair them up
            peer_uuid = self.unpaired_uuids_by_rid[rid]
            peer_req_ref_uuid = self.req_ref_by_uuid[peer_uuid]
            self._exit_unpaired(peer_uuid)
            self._enter_paired(rid, socket.uuid, peer_uuid)
            return "PAIRED", peer_uuid, peer_req_ref_uuid
        # no, wait for pair
        self._enter_unpaired(socket.uuid, rid, req_ref_uuid)
        return "WAITING", None, None

    ###########################################################################

    def is_socket_paired(self, uuid):
        return uuid in self.pairs_by_uuid

    def get_paired_socket(self, uuid):
        peer_uuid = self.pairs_by_uuid[uuid]['peer_uuid']
        return self.sockets_by_uuid[peer_uuid]

    def get_socket(self, uuid):
        return self.sockets_by_uuid[uuid]

    def get_rid(self, uuid):
        return self.pairs_by_uuid[uuid]['rid']

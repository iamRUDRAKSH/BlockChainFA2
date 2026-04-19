// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Timestamper {
    struct Commitment {
        address owner;
        uint256 timestamp;
        string ipfsCID;
    }

    mapping(bytes32 => Commitment) public commitments;

    event HashCommitted(
        bytes32 indexed docHash,
        address indexed owner,
        uint256 timestamp,
        string ipfsCID
    );

    function commitHash(bytes32 docHash, string calldata ipfsCID) external {
        require(commitments[docHash].timestamp == 0, "Hash already committed");

        commitments[docHash] = Commitment({
            owner: msg.sender,
            timestamp: block.timestamp,
            ipfsCID: ipfsCID
        });

        emit HashCommitted(docHash, msg.sender, block.timestamp, ipfsCID);
    }

    function commitMerkleRoot(bytes32 merkleRoot, string calldata ipfsCID) external {
        require(commitments[merkleRoot].timestamp == 0, "Hash already committed");

        commitments[merkleRoot] = Commitment({
            owner: msg.sender,
            timestamp: block.timestamp,
            ipfsCID: ipfsCID
        });

        emit HashCommitted(merkleRoot, msg.sender, block.timestamp, ipfsCID);
    }

    function verify(bytes32 docHash) external view returns (address owner, uint256 timestamp, string memory ipfsCID) {
        Commitment memory c = commitments[docHash];
        require(c.timestamp != 0, "Hash not found");
        return (c.owner, c.timestamp, c.ipfsCID);
    }
}

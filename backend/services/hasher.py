import hashlib


def sha256_file(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def build_merkle_root(hashes: list[str]) -> str:
    """Build a Merkle root from a list of hex hashes."""
    if not hashes:
        raise ValueError("Empty hash list")

    layer = [bytes.fromhex(h.replace("0x", "")) for h in hashes]

    while len(layer) > 1:
        if len(layer) % 2 != 0:
            layer.append(layer[-1])
        layer = [
            hashlib.sha256(layer[i] + layer[i + 1]).digest()
            for i in range(0, len(layer), 2)
        ]

    return layer[0].hex()

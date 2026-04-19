from datetime import datetime
import io

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_receipt(
    doc_hash: str,
    owner_address: str,
    tx_hash: str,
    timestamp: int,
    ipfs_cid: str,
) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "Academic IP Timestamp Receipt")

    c.setFont("Helvetica", 11)
    lines = [
        f"Document Hash (SHA-256): {doc_hash}",
        f"Owner Wallet:            {owner_address}",
        f"Transaction Hash:        {tx_hash}",
        f"Block Timestamp:         {datetime.utcfromtimestamp(timestamp).isoformat()} UTC",
        f"IPFS CID:                {ipfs_cid or 'N/A'}",
        "",
        "This receipt constitutes proof that the above document hash",
        "was committed to the Ethereum Sepolia blockchain at the stated time.",
        "Verify at: https://sepolia.etherscan.io/tx/" + tx_hash,
    ]

    y = 760
    for line in lines:
        c.drawString(50, y, line)
        y -= 22

    c.save()
    return buf.getvalue()

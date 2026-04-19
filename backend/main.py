from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from services.hasher import build_merkle_root, sha256_file
from services.receipt import generate_receipt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/hash")
async def hash_document(file: UploadFile = File(...)):
    content = await file.read()
    doc_hash = sha256_file(content)
    return {"hash": doc_hash, "hex": "0x" + doc_hash}


@app.post("/merkle")
async def merkle_root(hashes: list[str]):
    root = build_merkle_root(hashes)
    return {"merkle_root": root, "hex": "0x" + root}


@app.get("/receipt")
async def get_receipt(
    doc_hash: str,
    owner: str,
    tx_hash: str,
    timestamp: int,
    ipfs_cid: str = "",
):
    pdf_bytes = generate_receipt(doc_hash, owner, tx_hash, timestamp, ipfs_cid)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=receipt.pdf"},
    )

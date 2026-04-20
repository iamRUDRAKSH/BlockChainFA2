import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from backend.services.hasher import build_merkle_root, sha256_file
from backend.services.receipt import generate_receipt

app = FastAPI()

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
    "http://[::1]:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://0.0.0.0:5174",
    "http://[::1]:5174",
]
extra_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
allowed_origins = default_origins + extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+)(:\d+)?$",
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

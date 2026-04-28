import os
import aiohttp
from typing import Optional


async def upload_to_web3_storage(file_bytes: bytes, filename: str) -> Optional[str]:
    """
    Upload file to web3.storage and return CID.
    Returns None if upload fails.
    """
    token = os.getenv("WEB3_STORAGE_TOKEN", "").strip()
    if not token:
        return None

    url = "https://api.web3.storage/upload"
    headers = {
        "Authorization": f"Bearer {token}",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                data=aiohttp.FormData(fields=[("file", file_bytes, filename)]),
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("cid")
                return None
    except Exception as e:
        print(f"IPFS upload error: {e}")
        return None

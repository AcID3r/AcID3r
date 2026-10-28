"""Cache a real trophy SVG, retaining the last good image on service outages.

Mirrors are listed by upstream: github.com/ryo-ma/github-profile-trophy.
No credentials are sent. Only AcID3r's public username is requested.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/github-trophies.svg"
HOSTS = [
    "https://github-profile-trophy.vercel.app/",
    "https://github-profile-trophy-fork-two.vercel.app/",
    "https://github-profile-trophy-kannan.vercel.app/",
    "https://github-profile-trophy-liard-delta.vercel.app/",
    "https://trophy.ryglcloud.net/",
]
QUERY = "?username=AcID3r&theme=darkhub&no-frame=true&column=4&margin-w=12&margin-h=12"

def fetch(host):
    request = Request(host + QUERY, headers={"User-Agent":"AcID3r-profile-art", "Accept":"image/svg+xml"})
    with urlopen(request, timeout=12) as response:
        content = response.read(2_000_000)
    svg = ET.fromstring(content)
    if svg.tag != "{http://www.w3.org/2000/svg}svg":
        raise ValueError("Response was not an SVG")
    labels = " ".join(svg.itertext()).lower()
    if "error" in labels or "not found" in labels or not any(s in labels for s in ("commits", "repositories", "followers", "stars")):
        raise ValueError("Response did not contain trophy data")
    return host, content

def main():
    found = False
    with ThreadPoolExecutor(max_workers=len(HOSTS)) as pool:
        for future in as_completed([pool.submit(fetch, host) for host in HOSTS]):
            try:
                host, content = future.result()
            except Exception as error:
                print(f"Trophy endpoint unavailable: {type(error).__name__}")
                continue
            if not found:
                OUT.write_bytes(content)
                print(f"Cached real AcID3r trophies from {host}")
                found = True
    if not found:
        if OUT.exists():
            print("All endpoints unavailable; retaining the last good trophy image.")
        else:
            raise SystemExit("No trophy endpoint returned valid data.")

if __name__ == "__main__":
    main()

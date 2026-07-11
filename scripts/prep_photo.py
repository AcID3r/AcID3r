"""
Prepare a portrait photo for clean ASCII conversion:
  1. remove the background (rembg) so the subject is isolated
  2. boost LOCAL contrast (CLAHE) so a flatly-lit face gains highlights and
     shadows -- this is what turns a dark blob into a recognizable face
  3. composite the subject onto pure white so the background reads as blank
     (white -> spaces in the ascii ramp)

Output: source-prepped.png (grayscale), consumed by make_ascii_svg.py.
Run once whenever the source photo changes; the ascii SVG itself is static.

    python scripts/prep_photo.py <input.jpg> [output.png]
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

try:
    from rembg import remove
except ModuleNotFoundError:
    remove = None

HERE = os.path.dirname(os.path.abspath(__file__))
INP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "source.png")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "source-prepped.png")

# 1. cut out the subject. Prefer rembg when installed; otherwise use a local
# GrabCut mask seeded for a portrait where the subject is on the right side.
src = Image.open(INP).convert("RGBA")
src_alpha = np.array(src.split()[-1])
if remove:
    cut = remove(src)
    rgb = np.array(cut.convert("RGB"))
    alpha = np.array(cut.split()[-1])             # 0 = background
elif src_alpha.min() < 250:
    rgb = np.array(src.convert("RGB"))
    alpha = src_alpha
    # Remove tiny matte specks and smooth the supplied cutout edge.
    kernel = np.ones((3, 3), np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel, iterations=1)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel, iterations=1)
else:
    rgb = np.array(src.convert("RGB"))
    h, w = rgb.shape[:2]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    mask = np.full((h, w), cv2.GC_BGD, np.uint8)

    # Broad probable foreground around the person.
    x0, y0 = int(w * 0.34), int(h * 0.08)
    x1, y1 = w - 2, h - 2
    mask[y0:y1, x0:x1] = cv2.GC_PR_FGD

    # Definite foreground seeds: head/face and torso/shirt.
    cv2.ellipse(
        mask,
        (int(w * 0.62), int(h * 0.28)),
        (int(w * 0.16), int(h * 0.15)),
        0,
        0,
        360,
        cv2.GC_FGD,
        -1,
    )
    torso = np.array(
        [
            [int(w * 0.44), int(h * 0.42)],
            [int(w * 0.92), int(h * 0.38)],
            [w - 2, h - 2],
            [int(w * 0.37), h - 2],
        ],
        dtype=np.int32,
    )
    cv2.fillPoly(mask, [torso], cv2.GC_FGD)

    # Definite background bands: open landscape to the left/top.
    mask[:, : int(w * 0.28)] = cv2.GC_BGD
    mask[: int(h * 0.06), :] = cv2.GC_BGD

    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)

    alpha = np.where(
        (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD),
        255,
        0,
    ).astype(np.uint8)

    # Keep only the plausible portrait silhouette for this source crop. This
    # removes scenery that GrabCut can otherwise keep around hair/shoulders.
    geometry = np.zeros((h, w), np.uint8)
    head = np.array(
        [
            [int(w * 0.49), int(h * 0.14)],
            [int(w * 0.67), int(h * 0.13)],
            [int(w * 0.75), int(h * 0.20)],
            [int(w * 0.75), int(h * 0.30)],
            [int(w * 0.70), int(h * 0.37)],
            [int(w * 0.58), int(h * 0.39)],
            [int(w * 0.48), int(h * 0.35)],
            [int(w * 0.45), int(h * 0.27)],
            [int(w * 0.46), int(h * 0.19)],
        ],
        dtype=np.int32,
    )
    neck = np.array(
        [
            [int(w * 0.56), int(h * 0.34)],
            [int(w * 0.73), int(h * 0.34)],
            [int(w * 0.77), int(h * 0.46)],
            [int(w * 0.55), int(h * 0.46)],
        ],
        dtype=np.int32,
    )
    cv2.fillPoly(geometry, [head, neck], 255)
    cv2.ellipse(
        geometry,
        (int(w * 0.63), int(h * 0.36)),
        (int(w * 0.18), int(h * 0.10)),
        0,
        0,
        360,
        255,
        -1,
    )
    body = np.array(
        [
            [int(w * 0.49), int(h * 0.40)],
            [int(w * 0.76), int(h * 0.39)],
            [w - 2, int(h * 0.48)],
            [w - 2, h - 2],
            [int(w * 0.36), h - 2],
            [int(w * 0.38), int(h * 0.60)],
        ],
        dtype=np.int32,
    )
    cv2.fillPoly(geometry, [body], 255)
    alpha = cv2.bitwise_and(alpha, geometry)

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    ycrcb = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb)
    hue, sat = hsv[:, :, 0], hsv[:, :, 1]
    y, cr, cb = ycrcb[:, :, 0], ycrcb[:, :, 1], ycrcb[:, :, 2]
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    skin = (r > 80) & (g > 45) & (b > 25) & (cr > 130) & (cr < 180) & (cb > 70) & (cb < 135)
    skin_simple = (r > 90) & (r > g + 4) & (r > b + 10) & (y > 80)
    red_shirt = (r > g + 18) & (r > b + 18)
    head_zone = np.zeros((h, w), np.uint8)
    cv2.fillPoly(head_zone, [head], 1)
    dark_head = (head_zone == 1) & (y < 125)
    human_color = (skin | skin_simple | red_shirt | dark_head) & (geometry == 255)
    alpha[human_color] = 255
    green_bg = (hue >= 28) & (hue <= 95) & (sat > 35)
    alpha[(green_bg & ~skin & ~red_shirt & ~dark_head)] = 0
    upper_bg = (np.indices((h, w))[0] < int(h * 0.46)) & (geometry == 0)
    alpha[upper_bg] = 0

    kernel = np.ones((5, 5), np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel, iterations=1)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel, iterations=2)

# Crop to the extracted subject so already-cut-out images do not render as a
# tiny full-body figure in the ASCII grid.
ys, xs = np.where(alpha > 10)
if len(xs) and len(ys):
    h, w = alpha.shape[:2]
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    pad_x = max(16, int((x1 - x0 + 1) * 0.18))
    pad_y = max(16, int((y1 - y0 + 1) * 0.08))
    x0 = max(0, x0 - pad_x)
    x1 = min(w - 1, x1 + pad_x)
    y0 = max(0, y0 - pad_y)
    y1 = min(h - 1, y1 + pad_y)
    rgb = rgb[y0:y1 + 1, x0:x1 + 1]
    alpha = alpha[y0:y1 + 1, x0:x1 + 1]

# 2. local-contrast the luminance (CLAHE)
gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
gray = clahe.apply(gray)

# keep facial structure visible; the pure-white background is removed later by
# the ASCII generator's white-floor cutoff.
gray = cv2.convertScaleAbs(gray, alpha=1.0, beta=-6)

# 3. paste onto white using the alpha mask (feathered a hair to avoid a halo)
mask = (alpha.astype(np.float32) / 255.0)
mask = cv2.GaussianBlur(mask, (0, 0), 1.0)
out = gray.astype(np.float32) * mask + 255.0 * (1.0 - mask)
out = np.clip(out, 0, 255).astype(np.uint8)

Image.fromarray(out, mode="L").save(OUT)
print("wrote", OUT, out.shape)

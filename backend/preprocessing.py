import cv2
import numpy as np
from pathlib import Path

SIZE = 224


def focus_and_features(path_or_array, debug=False):

    if isinstance(path_or_array, (str, Path)):

        bgr = cv2.imread(str(path_or_array))

        if bgr is None:
            raise ValueError(f"Cannot read {path_or_array}")

        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    else:

        rgb = np.asarray(path_or_array).astype(np.uint8)

        bgr = cv2.cvtColor(
            rgb,
            cv2.COLOR_RGB2BGR
        )

    h, w = rgb.shape[:2]

    # Convert to HSV
    hsv = cv2.cvtColor(
        bgr,
        cv2.COLOR_BGR2HSV
    )

    H, S, V = cv2.split(hsv)

    # Create fruit mask
    mask = (
        (S > 35) &
        (V > 35) &
        (V < 250)
    ).astype(np.uint8) * 255

    # Morphological operations
    k = max(
        3,
        int(min(h, w) * 0.02) // 2 * 2 + 1
    )

    kernel = np.ones(
        (k, k),
        np.uint8
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel
    )

    # Find connected components
    n, lab, stats, cent = cv2.connectedComponentsWithStats(
        mask
    )

    best = None
    best_score = -1

    cx0, cy0 = w / 2, h / 2

    for i in range(1, n):

        x, y, ww, hh, area = stats[i]

        if area < 0.015 * h * w:
            continue

        cx, cy = cent[i]

        dist = np.sqrt(
            ((cx - cx0) / w) ** 2 +
            ((cy - cy0) / h) ** 2
        )

        score = area * (
            1.2 - max(0, dist)
        )

        if score > best_score:

            best_score = score

            best = (
                x,
                y,
                ww,
                hh,
                i
            )

    # Crop detected fruit
    if best:

        x, y, ww, hh, idx = best

        pad = int(
            0.12 * max(ww, hh)
        )

        x1 = max(0, x - pad)
        y1 = max(0, y - pad)

        x2 = min(
            w,
            x + ww + pad
        )

        y2 = min(
            h,
            y + hh + pad
        )

        crop = rgb[
            y1:y2,
            x1:x2
        ]

        cmask = (
            lab[y1:y2, x1:x2] == idx
        ).astype(np.uint8)

    else:

        # Center crop fallback
        side = int(
            0.85 * min(h, w)
        )

        x1 = (w - side) // 2
        y1 = (h - side) // 2

        crop = rgb[
            y1:y1 + side,
            x1:x1 + side
        ]

        cmask = np.ones(
            crop.shape[:2],
            np.uint8
        )

    # Convert crop
    cbgr = cv2.cvtColor(
        crop,
        cv2.COLOR_RGB2BGR
    )

    chsv = cv2.cvtColor(
        cbgr,
        cv2.COLOR_BGR2HSV
    )

    clab = cv2.cvtColor(
        cbgr,
        cv2.COLOR_BGR2LAB
    )

    pix = cmask.astype(bool)

    if pix.sum() < 100:
        pix = np.ones(
            crop.shape[:2],
            bool
        )

    # -------------------------
    # COLOR FEATURES
    # -------------------------

    feats = []

    hh = chsv[:, :, 0][pix].astype(
        np.float32
    )

    feats += [
        hh.mean() / 179,
        hh.std() / 179,
        np.percentile(hh, 25) / 179,
        np.percentile(hh, 50) / 179,
        np.percentile(hh, 75) / 179,
        np.mean(
            (hh >= 25) &
            (hh <= 95)
        )
    ]

    for arr in [
        chsv[:, :, 1],
        chsv[:, :, 2],
        clab[:, :, 0],
        clab[:, :, 1],
        clab[:, :, 2]
    ]:

        v = arr[pix].astype(
            np.float32
        )

        feats += [
            v.mean() / 255,
            v.std() / 255
        ]

    feats += [
        np.mean(
            (hh >= 35) &
            (hh <= 95)
        ),

        np.mean(
            (hh >= 15) &
            (hh < 35)
        )
    ]

    feats = np.asarray(
        feats,
        dtype=np.float32
    )

    # Resize image to 224x224
    crop = cv2.resize(
        crop,
        (SIZE, SIZE),
        interpolation=cv2.INTER_AREA
    )

    # IMPORTANT
    return crop, feats
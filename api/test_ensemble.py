#!/usr/bin/env python3
"""
Test script for the ensemble beauty prediction model.
This script loads a sample image and runs it through the ensemble model.
"""

import os
import sys
import argparse
from beauty_ensemble import predict_beauty_ensemble


def main():
    parser = argparse.ArgumentParser(
        description="Test the ensemble beauty prediction model"
    )
    parser.add_argument("image_path", help="Path to the image file to test")
    parser.add_argument(
        "--scut-weight", type=float, default=0.5, help="Weight for SCUT model (0-1)"
    )
    parser.add_argument(
        "--mebeauty-weight",
        type=float,
        default=0.5,
        help="Weight for MEBeauty model (0-1)",
    )

    args = parser.parse_args()

    if not os.path.exists(args.image_path):
        print(f"Error: Image file not found: {args.image_path}")
        return 1

    print(f"Running ensemble prediction on {args.image_path}...")
    print(f"Weights: SCUT={args.scut_weight}, MEBeauty={args.mebeauty_weight}")

    result = predict_beauty_ensemble(
        args.image_path,
        scut_weight=args.scut_weight,
        mebeauty_weight=args.mebeauty_weight,
    )

    print("\nResults:")
    print("-" * 40)

    if result.get("error"):
        print(f"Error: {result['error']}")
        return 1

    print(f"SCUT score:      {result['scut_score']:.2f}/5.00")
    print(f"MEBeauty score:  {result['mebeauty_score']:.2f}/5.00")
    print(f"Ensemble score:  {result['ensemble_score']:.2f}/5.00")

    return 0


if __name__ == "__main__":
    sys.exit(main())

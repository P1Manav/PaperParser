import fitz  # PyMuPDF
import os
import json
import re


def group_image_bboxes(image_bboxes, y_tol=80, x_gap_tol=100):
    # Sort images top to bottom, then left to right
    image_bboxes.sort(key=lambda b: (round(b.y0), b.x0))
    groups = []
    current_group = []

    for bbox in image_bboxes:
        if not current_group:
            current_group.append(bbox)
            continue

        last_bbox = current_group[-1]

        # Check if bbox is on same row (within y-tolerance)
        same_row = abs(bbox.y0 - last_bbox.y0) < y_tol

        # Check if horizontal gap is small enough
        horizontal_gap = bbox.x0 - last_bbox.x1
        close_enough = horizontal_gap < x_gap_tol

        if same_row and close_enough:
            current_group.append(bbox)
        else:
            groups.append(current_group)
            current_group = [bbox]

    if current_group:
        groups.append(current_group)

    return groups






def extract_combined_images_with_captions(file_path: str):
    pdf_file = fitz.open(file_path)
    os.makedirs("images", exist_ok=True)
    image_caption_map = {}
    image_id = 1  # to name images like image1.png, image2.png ...

    for page_index in range(len(pdf_file)):
        page = pdf_file.load_page(page_index)
        image_list = page.get_images(full=True)

        # Step 1: Collect image bounding boxes
        bboxes = []
        for img in image_list:
            image_name = img[7]  # get image name like 'Im1'
            try:
                bbox = page.get_image_bbox(image_name)
                bboxes.append(bbox)
            except Exception:
                continue

        # Step 2: Group images that are side-by-side
        groups = group_image_bboxes(bboxes)

        for group in groups:
            # Step 3: Merge bounding box of grouped images
            merged_bbox = fitz.Rect(
                min(b.x0 for b in group),
                min(b.y0 for b in group),
                max(b.x1 for b in group),
                max(b.y1 for b in group),
            )

            # Step 4: Extract combined image as pixmap
            zoom = 10
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, clip=merged_bbox)

            image_filename = f"image{image_id}.png"
            image_path = os.path.join("images", image_filename)
            pix.save(image_path)

            # Step 5: Extract caption just below the image group
            caption_area = fitz.Rect(
                merged_bbox.x0 - 300,
                merged_bbox.y1,
                merged_bbox.x1 + 300,
                merged_bbox.y1 + 400,  # Area below image to search for caption
            )
            caption_text = page.get_textbox(caption_area).strip()

            # Find "Figure X: ..." using regex
            figure_match = re.search(
                r"(?:Figure|Fig\.)\s?\d+\s?:\s?.+",
                caption_text,
                re.IGNORECASE,
            )

           

            figure_caption = (
                figure_match.group(0).strip()
                if figure_match
                else "No Figure caption found"
            )

            # Step 6: Save mapping
            image_caption_map[image_filename] = figure_caption

            image_id += 1

    # Step 7: Save all captions to JSON
    with open("images/image_captions.json", "w", encoding="utf-8") as f:
        json.dump(image_caption_map, f, indent=2, ensure_ascii=False)

    # print("\n All grouped images and captions saved successfully in 'images/'")


if __name__ == "__main__":
    extract_combined_images_with_captions(r"..\2.pdf")

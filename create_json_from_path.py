import os
import json
from PIL import Image

def create_coco_images_json(image_dir, output_file):
    coco = {
        "images": []
    }

    image_id = 1

    for filename in os.listdir(image_dir):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            image_path = os.path.join(image_dir, filename)
            image = Image.open(image_path)
            width, height = image.size

            image_info = {
                "id": image_id,
                "file_name": filename,
                "width": width,
                "height": height,
                "date_captured": "",
                "license": 0,
                "coco_url": "",
                "flickr_url": ""
            }
            coco["images"].append(image_info)
            image_id += 1

    with open(output_file, 'w') as f:
        json.dump(coco, f, indent=4)

# Usage
image_dir = 'PTTEP'
output_file = 'coco_images.json'
create_coco_images_json(image_dir, output_file)

import os
import json
import yaml
from PIL import Image

def load_categories_from_yaml(yaml_file):
    with open(yaml_file, 'r') as f:
        categories = yaml.safe_load(f)
    
    return categories

def create_coco_images_json(image_dir, output_file, category_file):
    coco = {
        "images": [],
        "annotations": [],
        "categories": []
    }

    # Load categories from the YAML file
    categories = load_categories_from_yaml(category_file)
    
    # Populate coco categories
    for category in categories:
        coco["categories"].append({
            "id": category['id'],
            "name": category['name'],
            "supercategory": category.get('supercategory', '')
        })

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
image_dir = 'PTTEP/ER'
output_file = 'coco_images.json'
category_file = 'categories.yaml'  # Your YAML file with categories
create_coco_images_json(image_dir, output_file, category_file)


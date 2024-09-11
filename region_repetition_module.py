from PIL import Image, ImageDraw
import os

def convert_yolo_annotation(annotation_path, image_width, image_height, class_mapping=None):
    annotations = []

    with open(annotation_path, 'r') as f:
        lines = f.readlines()

    for line in lines:
        parts = line.strip().split()
        if len(parts) < 5:
            continue

        class_id = int(parts[0])
        center_x, center_y, box_width, box_height = map(float, parts[1:5])

        # Convert normalized coordinates to pixel values
        left = int((center_x - box_width / 2) * image_width)
        top = int((center_y - box_height / 2) * image_height)
        width = int(box_width * image_width)
        height = int(box_height * image_height)

        # Optionally map class IDs to class names
        class_name = class_mapping.get(class_id, str(class_id)) if class_mapping else str(class_id)

        annotations.append({
            'class_id': class_id,
            'class_name': class_name,
            'top': top,
            'left': left,
            'width': width,
            'height': height
        })

    return annotations

def write_yolo_annotation(output_path, annotations, image_width, image_height):
    with open(output_path, 'w') as f:
        for annotation in annotations:
            class_id = annotation['class_id']
            top = annotation['top']
            left = annotation['left']
            width = annotation['width']
            height = annotation['height']

            # Convert pixel coordinates to normalized coordinates
            center_x = (left + width / 2) / image_width
            center_y = (top + height / 2) / image_height
            box_width = width / image_width
            box_height = height / image_height

            # Write annotation line in YOLOv5 format
            line = f"{class_id} {center_x:.6f} {center_y:.6f} {box_width:.6f} {box_height:.6f}\n"
            f.write(line)


def create_repetition_image(image_path, annotation_path, image_size: int = 288, number: int = 10):
    # Create a new blank image
    result_image = Image.new("RGB", (image_size, image_size), (255, 255, 255))

    original_image = Image.open(image_path)
    image_width = result_image.width  # Replace with your image width
    image_height = result_image.height  # Replace with your image height

    # Define the number of repetitions and the spacing between pasted regions
    number_repetition = number
    spacing = 5
    x, y = 0, 0  # Initial positions
    current_row_height = 0

    annotations = convert_yolo_annotation(annotation_path, image_width, image_height)

    new_annotation = []

    for annotation in annotations:
        x1 = annotation['left']
        y1 = annotation['top']
        x2 = x1 + annotation['width']
        y2 = y1 + annotation['height']

        current_row_height = annotation['height'] if annotation['height'] > current_row_height else current_row_height

        cropped_region = original_image.crop((x1, y1, x2, y2))

        for _ in range(number_repetition):

            # If cropped region will be paste exceed result_image then finish
            if y + current_row_height > result_image.height:
                break;
            
            # Paste the cropped region and save the new annotation
            result_image.paste(cropped_region, (x, y))
            new_annotation.append({
                    'class_id': annotation['class_id'],
                    'class_name': annotation['class_name'],
                    'top': y,
                    'left': x,
                    'width': annotation['width'],
                    'height': annotation['height']
                })

            # Move to the next column
            x += cropped_region.width + spacing

            # Check if the next column exceeds the width of the result_image
            if x + cropped_region.width > image_width:
                x = 0  # Reset x to start a new row
                y += current_row_height + spacing  # Move to the next row

    return result_image, new_annotation

# Path template

dataset_path = "datasets/dataset300/images/train/"
save_dir = "output/images"
file_name = "pid_000000_46"

# Get a list of all image files in the input folder
image_files_path = [f for f in os.listdir(dataset_path) if f.endswith('.jpg')]

for image_path in image_files_path:
    image_path = os.path.join(dataset_path, image_path)
    annotation_path = image_path.replace('images', 'labels')
    annotation_path = annotation_path.replace('jpg', 'txt')
    base_filename = os.path.splitext(os.path.basename(image_path))[0]
    
    result_image, new_annotation = create_repetition_image(image_path, annotation_path)

    save_ann_path = os.path.join(save_dir, base_filename+".txt")
    save_img_path = os.path.join(save_dir, base_filename+".jpg")
    write_yolo_annotation(save_ann_path, new_annotation, result_image.width, result_image.height)
    result_image.save(save_img_path)

exit()

image_path = os.path.join(dataset_path, "images/train/"+file_name+".jpg")
annotation_path = os.path.join(dataset_path, "labels/train/"+file_name+".txt")

result_image, new_annotation = create_repetition_image(image_path, annotation_path)

write_yolo_annotation("test/new_annotation.txt", new_annotation, result_image.width, result_image.height)
result_image.save("test/new_annotation.jpg")
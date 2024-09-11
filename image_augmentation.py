import torchvision

torchvision.disable_beta_transforms_warning()  # disable torchvision warnning

from pid_scraper import augement_images, shuffle_images
import os

input_path = './datasets/input'
output_path = './datasets/tmp'
image_size = 640
max_file_number = 200

augement_images(
    input_folder=input_path,
    output_folder=output_path,
    labels_folder=input_path,
    image_size=image_size,
    max_file_number=max_file_number
    )

#yolo2createml(yolo_txts_path=output_path, config_file="datasets/yaml/data_v8s.yaml", output_file=os.path.join(output_path, "annotations.json"))

shuffle_images(output_path, output_path, 0.8, copy=False)

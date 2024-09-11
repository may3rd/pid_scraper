import torch
import cv2
from pathlib import Path

model_path = "./yolo_weights/best.pt"
input_images_path = './yolov5/datasets/images/validation'
output_path = './static/images/results'


def get_yolov5(confident_val):
    model = torch.hub.load('./yolov5', 'custom', path=model_path, source='local')
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    model.conf = confident_val
    return model


if __name__ == '__main__':
    model_valve = get_yolov5(0.01)

    # Get a list of input image paths
    input_image_paths = Path(input_images_path).glob('*.jpg')  # Change the extension if needed

    # Loop through input images and perform detection
    for image_path in input_image_paths:
        image = cv2.imread(str(image_path))  # Load image using OpenCV
        results = model_valve(image)  # Perform object detection
        detected_image = results.render()[0]  # Render the detected objects on the image

        # Save the rendered image to the output path
        output_image_path = Path(output_path) / image_path.name
        cv2.imwrite(str(output_image_path), detected_image)
        print(f"Processed {image_path.name} and saved to {output_image_path}")

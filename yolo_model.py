from ultralytics import YOLO, settings
from ultralytics.utils.plotting import colors
from typing import Union
from PIL import Image
import cv2
import argparse
import numpy as np


def train_new_model(
        config_path: str = "data/valves.yaml",
        epochs: int = 20,
        image_size: int = 640,
        batch: int = 32,
        cache: bool = False,
        fine_tune: bool = True,
):
    model = YOLO("yolov8n.yaml")  # build a new model from scratch
    # model = YOLO('yolov8n.pt')  # load a pretrained model

    #settings.update({'tensorboard': False})
    #settings.update({'datasets_dir': './', 'runs_dir': 'runs'})

    # training with default learning rate
    model.train(data=config_path,
                epochs=epochs,
                exist_ok=True,
                imgsz=image_size,
                batch=batch,
                cache=cache,
                val=True)

    # fine tune the model with slower learning rate
    if fine_tune:
        output_path = settings['runs_dir'] + "/detect/train/weights/best.pt"
        settings.update({'datasets_dir': './', 'runs_dir': 'tunes'})
        model_tune = YOLO(output_path)
        model_tune.train(data=config_path,
                         epochs=20,
                         exist_ok=True,
                         imgsz=image_size,
                         batch=16,
                         pretrained=True,
                         lr0=0.0032,
                         lrf=0.12,
                         momentum=0.843,
                         weight_decay=0.00036,
                         warmup_epochs=2.0,
                         warmup_momentum=0.5,
                         warmup_bias_lr=0.05,
                         box=0.0296,
                         cls=0.243,
                         kobj=0.301,
                         val=True
                         )
    return


def predict(
        image_path: Union[str, None, "numpy.ndarray"] = "datasets/PID_dataset/images/test/14780-8120-25-21-0003_145.jpg",
        output_path: str = "predict_result.jpg",
        model_path: str = "yolo_weights/best.pt",
        conf: float = 0.25,
        image_size: int = 640,
        save: bool = False,
):
    model = YOLO(model=model_path)

    if isinstance(image_path, str):
        image = Image.open(image_path)
    else:
        image = image_path

    cv2_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    segment_size = (image_size, image_size)
    segmented_images = segment_image(image, segment_size)

    bboxes = []
    names = []

    for i, (segment, left, top, width, height) in enumerate(segmented_images):
        prediction_result = model.predict(
            segment, conf=conf, imgsz=image_size, show_conf=False, show_labels=False)[0]
        boxes = np.array(prediction_result.boxes.data)
        if len(boxes) > 0:
            for b in boxes:
                b[0] = int(b[0] + left)
                b[1] = int(b[1] + top)
                b[2] = int(b[2] + left)
                b[3] = int(b[3] + top)
                b[-1] = int(b[-1])
                bboxes.append(b)
            names = prediction_result.names
            # paste section image to original image
            image.paste(Image.fromarray(
                prediction_result.plot()[..., ::-1]), (left, top, left + width, top + height))

    array_data = np.array(bboxes)
    new_array_data = array_data[:, [0, 1, 2, 3, 5]]
    bboxes = new_array_data.tolist()
    unique_boxes = set(map(tuple, bboxes))
    bboxes = list(map(list, unique_boxes))

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.7
    text_thickness = 1

    for i, box in enumerate(bboxes):
        text_color = colors(box[-1], True)
        cv2.rectangle(cv2_image, (box[0], box[1]),
                      (box[2], box[3]), text_color, 2)
        text = names[box[-1]]
        text_position = (box[0], box[1])
        cv2.putText(cv2_image, text, text_position, font,
                    font_scale, text_color, text_thickness)

#    cv2.imshow("Result", cv2_image)
#    cv2.waitKey(0)
#    cv2.destroyAllWindows()

    if save:
        cv2.imwrite(output_path, cv2_image)

    return image


def parse_opt(known=False):
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', type=str,
                        default='train', help='train or predict')
    parser.add_argument(
        '--config', type=str, default='datasets/dataset300/dataset.yaml', help='path to config file *.yaml')
    parser.add_argument('--weights', type=str,
                        default='yolo_weights/best.pt', help='training mode')
    parser.add_argument('--input', type=str,
                        default='datasets/PID_dataset/images/test/14780-8120-25-21-0003_145.jpg',
                        help='input file path for detection')
    parser.add_argument('--output', type=str,
                        default='predict_result.jpg', help='output path')
    parser.add_argument('--conf', type=float, default=0.5,
                        help='confident value for detect mode')
    parser.add_argument('--epochs', type=int, default=200, help='')
    parser.add_argument('--imgsz', type=int, default=640, help='')
    parser.add_argument('--batch', type=int, default=32, help='batch size')
    parser.add_argument('--fine_tune', type=bool, default=False,
                        help='run fine ture after trained ([True], False)')

    return parser.parse_known_args()[0] if known else parser.parse_args()


def segment_image(orig_image, segment_size):
    image_width: int
    image_height: int
    image_width, image_height = orig_image.size
    segment_width, segment_height = segment_size
    segments = []

    for top in range(0, image_height, int(segment_height/2)):
        for left in range(0, image_width, int(segment_width/2)):
            right = min(left + segment_width, image_width)
            bottom = min(top + segment_height, image_height)
            segment = orig_image.crop((left, top, right, bottom))
            segments.append((segment, left, top, right - left, bottom - top))

    return segments


if __name__ == '__main__':
    opt = parse_opt()

    if opt.mode == 'train':
        print(opt.config)
        train_new_model(
            config_path=opt.config,
            epochs=opt.epochs,
            image_size=opt.imgsz,
            batch=opt.batch,
            fine_tune=opt.fine_tune)
    else:
        result = predict(
            model_path=opt.weights,
            image_path=opt.input,
            output_path=opt.output,
            conf=opt.conf,
            save=True,
        )

        result.save(opt.output)

# Ultralytics YOLO 🚀, AGPL-3.0 license
# Example usage: yolo train data=coco128.yaml
# path/to/dataset
# ├── dataset.yaml
# ├── images
# │   ├── train
# │   └── val
# └── labels
#     ├── train
#     └── val
# WARNING ⚠️ imgsz=[300] must be multiple of max stride 32, updating to [320]
#
#yolo task=detect mode=train data=datasets/PIDSCRAPER/data.yaml model=yolov8s.yaml epochs=300 batch=4 imgsz=640 name=yolov8s exist_ok=True


yolo task=detect mode=train data=datasets/balanced/balanced.yaml model=yolo_weights/yolov8_PPCL_640_20231022.pt epochs=30 batch=16 imgsz=640 lr0=0.00002 weight_decay=0.001 momentum=0.9 workers=4 name=balanced exist_ok=True device=mps optimizer=Adam flipud=False fliplr=False

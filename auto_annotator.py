from ultralytics.data.annotator import auto_annotate

auto_annotate(data='datasets/PIDSCRAPER/images/valid', det_model='yolo_weights/yolov8_640_20230923.pt', output_dir='test/auto_anno')

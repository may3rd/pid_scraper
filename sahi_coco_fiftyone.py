"""
run prediction of the images in coco_dataset.json file.
and save the prediction results in draw_labels_path.

see sahi_fifityone_from_pdf.ipynb for example to create coco_dataset.json.

"""
from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction, predict, predict_fiftyone
from sahi.utils.cv import read_image_as_pil
import fiftyone as fo
import fiftyone.utils.coco as fouc
import fiftyone.utils.annotations as foua

source_path = ""
dataset_json_path = source_path + "fiftyone/coco_test/coco_dataset.json"
draw_labels_path = source_path + "/draw-labels"
model_type = "yolov8"
model_path = "yolo_weights/best_20230813.pt"
model_config_path = "data/dataset.yaml"
model_device = "cpu"
slice_height = 640
slice_width = 640

# get batch predict result
result = predict(
    model_type=model_type,  # one of 'yolov5', 'mmdet', 'detectron2'
    model_path=model_path,  # path to model weight file
    model_config_path=model_config_path,  # for detectron2 and mmdet models
    model_confidence_threshold=0.1,
    model_device=model_device,  # or 'cuda:0'
    source=source_path,  # image or folder path
    no_standard_prediction=True,
    no_sliced_prediction=False,
    slice_height=slice_height,
    slice_width=slice_width,
    overlap_height_ratio=0.1,
    overlap_width_ratio=0.1,
    export_pickle=False,
    export_crop=False,
    novisual=True,
    project=source_path,
    name="ext",
    dataset_json_path=dataset_json_path,
    return_dict=True
)

prediction_path = str(result["export_dir"]) + "/result.json"
print("The result is save to", prediction_path)

# Load COCO formatted dataset
coco_dataset = fo.Dataset.from_dir(
    dataset_type=fo.types.COCODetectionDataset,
    data_path=source_path,
    labels_path=dataset_json_path,
    include_id=True,
)

# Verify that the class list for our dataset was imported
print(coco_dataset.default_classes)  # ['airplane', 'apple', ...]

# Add COCO prediction to 'predictions' field of dataset
classes = coco_dataset.default_classes
fouc.add_coco_labels(coco_dataset, "predictions", prediction_path, classes)

# Verify that predictions were added to image
print(coco_dataset.count("predictions"))

coco_dataset.save()

view = coco_dataset.view()

# Launch the fiftyone App
session = fo.launch_app(dataset = coco_dataset, view = view)

# Blocks execution until the App is closed
session.wait()

session.close()

from sahi.predict import predict, predict_fiftyone
from sahi import AutoDetectionModel

# init a model
detection_model = AutoDetectionModel.from_pretrained(
    model_type="yolov8",
    model_path="yolo_weights/best_20230813.pt",
    config_path="data/pid_dataset.yaml",
    confidence_threshold=0.4,
    device="cpu",
)

result = predict(
    detection_model=detection_model,
    source="test",  # image or folder path
    no_standard_prediction=True,
    no_sliced_prediction=False,
    slice_height=640,
    slice_width=640,
    overlap_height_ratio=0.02,
    overlap_width_ratio=0.02,
    export_pickle=False,
    export_crop=False,
    visual_bbox_thickness=1,
    visual_text_size=0.5,
    visual_text_thickness=1,
    visual_export_format="jpg",
    project="output",
    name="ext",
    return_dict=True,
    #dataset_json_path="./output/json",
)

exit(0)

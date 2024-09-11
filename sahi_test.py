"""
Test sahi libraly
"""

from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction
from sahi.utils.cv import read_image_as_pil

input_image_file: str = "test/pid_00002.jpg"
sahi_slice_size: int = 640
coreml_image_size: tuple [int, int] = (416, 416)
overlap_ratio: float = 32 / sahi_slice_size
weight_file: str = "coremlmodels/pid_scraper_11_640x640_14Sep.mlmodel"
config_file: str = "datasets/yaml/createML.yaml"
conf_thred: float = 0.25
save_dir: str = "output/coreml_test"

detection_model = AutoDetectionModel.from_pretrained(
    model_type="coreml",
    model_path=weight_file,
    config_path=config_file,
    confidence_threshold=conf_thred,
    device="cpu",
    image_size=sahi_slice_size,
    coreml_image_size=coreml_image_size,
)

image_input_as_pil = read_image_as_pil(input_image_file)

result = get_sliced_prediction(
    image_input_as_pil,
    detection_model,
    slice_height=sahi_slice_size,
    slice_width=sahi_slice_size,
    overlap_height_ratio=overlap_ratio,
    overlap_width_ratio=overlap_ratio,
)

export_result = result.export_visuals(
    export_dir=save_dir,
    text_size=0.5,
    rect_th=1,
    hide_labels=False,
    hide_conf=True,
    file_name="prediction_visual",)

exit(0)

import cv2

result_image = export_result['image']

result_image = cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB)

cv2.imshow("Iamge", result_image)
cv2.waitKey(0)
cv2.destroyAllWindows()

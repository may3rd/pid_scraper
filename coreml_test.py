import coremltools as ct
from PIL import Image 

input_image_file: str = 'datasets/640/images/valid/pid_00001_53.jpg' 
example_image: Image.Image = Image.open(input_image_file).resize((416,416))
mlmodel_file: str = 'coremlmodels/pid_scraper_11.mlmodel' 
model = ct.models.MLModel(mlmodel_file) 
out_dict: dict = model.predict({'imagePath': example_image,})

spec = ct.utils.load_spec(mlmodel_file)
class_labels: list = spec.pipeline.models[1].nonMaximumSuppression.stringClassLabels.vector # type: ignore
print({str(ind): category_name for ind, category_name in enumerate(class_labels)})

objects: str = out_dict['coordinates']
confidences = out_dict['confidence']
predictions = []

for index, object in enumerate(objects):
    confidence = list(confidences[index])
    max_conf = max(confidence)
    max_index = confidence.index(max_conf)
    predictions.append(
        {
            'class_id': max_index,
            'class_label': class_labels[max_index],
            'bbox': object,
            'confidence': max_conf,
        }
    )

for item in predictions:
    print(item['class_label'], item['bbox'], item['confidence'])

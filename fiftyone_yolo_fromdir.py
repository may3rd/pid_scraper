import fiftyone as fo

name = "dataset"
dataset_dir = "datasets/dataset/"

# The splits to load
splits = ["train", "val"]

# Load the dataset, using tags to mark the samples in each split
dataset: fo.Dataset = fo.Dataset(name)  # type: ignore
for split in splits:
    dataset.add_dir(
        dataset_dir=dataset_dir,
        dataset_type=fo.types.YOLOv5Dataset,  # type: ignore
        split=split,
        tags=split,
    )

coco_classes = [c for c in dataset.default_classes if not c.isnumeric()] # type: ignore

export_dir = "datasets/export"

# The name of the sample field containing the label that you wish to export
# Used when exporting labeled datasets (e.g., classification or detection)
label_field = "ground_truth"  # for example

# The type of dataset to export
# Any subclass of `fiftyone.types.Dataset` is supported
dataset_type = fo.types.COCODetectionDataset  # type: ignore

# Export the dataset
dataset.export(
    export_dir=export_dir,
    dataset_type=dataset_type,
    label_field=label_field,
    classes=coco_classes,
)

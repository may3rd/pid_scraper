from sahi.slicing import slice_image

image_file:str = "test/test_predict.jpg"
output_file_name:str = "sliced"
output_dir:str = "test/sliced"
slice_size: int = 640
overlap_size: float = 0.2

slice_image_result, num_total_invalid_segmentation = slice_image(
    image=image_file,
    output_file_name=output_file_name,
    output_dir=output_dir,
    slice_height=slice_size,
    slice_width=slice_size,
    overlap_height_ratio=overlap_size,
    overlap_width_ratio=overlap_size,
)

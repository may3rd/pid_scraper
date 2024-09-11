# import craft functions
from craft_text_detector import (
    read_image,
    load_craftnet_model,
    load_refinenet_model,
    get_prediction,
    export_detected_regions,
    export_extra_results,
    empty_cuda_cache,
)

from craft_text_detector.file_utils import list_files

import cv2
import numpy as np
import os


def detect_images(
        images,  # images as list of cv2 images,
        save: bool = False,
        cuda: bool = False,
):
    return_images = []

    # load models
    refine_net = load_refinenet_model(cuda=cuda)
    craft_net = load_craftnet_model(cuda=cuda)

    for idx, img in enumerate(images):
        print("Processing image index of", idx, "...")
        image = read_image(img)

        # perform prediction
        prediction_result = get_prediction(
            image=image,
            craft_net=craft_net,
            refine_net=refine_net,
            text_threshold=0.7,
            link_threshold=0.4,
            low_text=0.4,
            cuda=cuda,
            long_size=1024,
            poly=False,
        )

        # export detected text regions
        exported_file_paths, exported_images = export_detected_regions(
            image=image,
            regions=prediction_result["boxes"],
            rectify=True,
            save=save,
        )

        for img in exported_images:
            return_images.append(img)

    # unload models from gpu
    empty_cuda_cache()

    return return_images


def detect_image_path(
        image_path: str = 'datasets/PID_dataset/images/test',
        output_path: str = 'test/craft',
        cuda: bool = False,
        save: bool = False,
):
    img_files, mask_files, gt_files = list_files(image_path)
    return_images = []

    # load models
    refine_net = load_refinenet_model(cuda=cuda)
    craft_net = load_craftnet_model(cuda=cuda)

    for idx, img_file in enumerate(img_files):
        print("Processing", img_file, "...")
        # read image
        image = read_image(img_file)

        # perform prediction
        prediction_result = get_prediction(
            image=image,
            craft_net=craft_net,
            refine_net=refine_net,
            text_threshold=0.7,
            link_threshold=0.4,
            low_text=0.4,
            cuda=cuda,
            long_size=1024,
            poly=False,
        )

        filename = os.path.splitext(os.path.basename(img_file))[0]

        # export detected text regions
        _, exported_images = export_detected_regions(
            image=image,
            regions=prediction_result["boxes"],
            output_dir=os.path.join(output_path, filename),
            rectify=True,
            save=save,
        )

        for img in exported_images:
            return_images.append(img)

        # export heatmap, detection points, box visualization
        export_extra_results(
            image=image,
            regions=prediction_result["boxes"],
            heatmaps=prediction_result["heatmaps"],
            output_dir=os.path.join(output_path, filename),
        )

    # unload models from gpu
    empty_cuda_cache()

    return return_images


class Craft_engine:
    def __init__(self, cuda: bool = False) -> None:
        self.cuda = cuda
        self.refine_net = load_refinenet_model(cuda=self.cuda)
        self.craft_net = load_craftnet_model(cuda=self.cuda)
        self.prediction_result = []
        self.detected_regions = []
        self.result_images = []

    def prediction(self,
                input_data,
                text_threshold: float = 0.7,
                link_threshold: float = 0.4,
                low_text: float = 0.4,
                long_size: int = 1280,
                poly: bool = False,
                save: bool = False,
            ):
        """
        """
        input_images = []
        # check the input
        if isinstance(input_data, str):
            input_images.append(read_image(input_data))
        elif isinstance(input_data, list) and all(isinstance(item, str) for item in input_data):
            for item in input_data:
                input_images.append(read_image(item))
        elif isinstance(input_data, list):
            for item in input_data:
                input_images.append(read_image(item))
        elif type(input_data) == bytes | type(input_data) == np.ndarray:
            input_images.append(read_image(input_data))

        for image in input_images:
            prediction_result = get_prediction(
                image=image,
                craft_net=self.craft_net,
                refine_net=self.refine_net,
                text_threshold=text_threshold,
                link_threshold=link_threshold,
                low_text=low_text,
                cuda=self.cuda,
                long_size=long_size,
                poly=poly,
            )
            self.prediction_result.append(prediction_result)

            # export detected text regions
            exported_file_paths, exported_images = export_detected_regions(
                image=image,
                regions=prediction_result["boxes"],
                rectify=True,
                save=save,
            )
            self.detected_regions.append(exported_images)

            # export heatmap, detection points, box visualization
            result_image = export_extra_results(
                image=image,
                regions=prediction_result["boxes"],
                heatmaps=prediction_result["heatmaps"],
                save=save,
            )
            self.result_images.append(result_image)
    def __del__(self) -> None:
        empty_cuda_cache()


if __name__ == "__main__":
    craft_engine = Craft_engine()

    img_files, mask_files, gt_files = list_files('./test')
    images = []
    for item in img_files:
        image = read_image(item)
        images.append(image)

    craft_engine.prediction(images, save=False)

    for image in craft_engine.result_images:
        cv2.imshow("Image", image)
        cv2.waitKey(0)

    cv2.destroyAllWindows()

    exit(0)

    export_images = detect_image_path()

    print(len(export_images))

    cv2.imshow("Image", export_images[0])
    cv2.waitKey(0)
    cv2.destroyAllWindows()

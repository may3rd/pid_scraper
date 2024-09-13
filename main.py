import uvicorn

from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import Response

from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction
from sahi.utils.cv import crop_object_predictions

from PIL import Image
import cv2
import numpy as np
import json
import math
import glob
import easyocr

from pid_scraper import utils as utils

# Define the model type for inferencing
MODEL_TYPES = [
    {"name": 'yolov8onnx', "value": 'yolov8onnx'},
    {"name": 'yolov8', "value": 'yolov8'},]

SYMBOL_WITH_TEXT = [ 
    "page connection", 
    "utility connection",
    "instrument DCS",
    "instrument-DCS",
    "instrument logic",
    "instrument tag", 
]


def list_weight_files():
    '''
    List the trained weight files from paths
    '''
    weight_files = []
    weight_paths = [r"yolo_weights/*.onnx", r"yolo_weights/*.pt"]

    for path in weight_paths:
        file_list = glob.glob(path)
        file_list.sort()
        for item in file_list:
            weight_files.append({"item": item})

    return weight_files


def list_config_files():
    config_files = []
    file_list = glob.glob(r"datasets/yaml/*.yaml")
    file_list.sort()

    for item in file_list:
        config_files.append({"item": item})

    return config_files


WEIGHT_FILE_LIST = list_weight_files()
CONFIG_FILE_LIST = list_config_files()
    
# Create Reader for text OCR
reader = easyocr.Reader(['en'])

# image is cv2
def extract_text_from_image(image, objects) -> list:
    '''
    extract_text_from_image:
    param: image
    param: objects
    
    return: list of read text
    '''
    # if objects is None or zero member then return nothing
    if len(objects) < 1:
        return []
    
    return_list = []
    
    # Loop through objects list
    for index, object in enumerate(objects):
        x_start, y_start, x_end, y_end = (
            object["Left"],
            object["Top"],
            object["Left"] + object["Width"],
            object["Top"] + object["Height"]
        )

        cropped_img_name = f"output/cropped_image_{index}.png"
        cropped_img = image[y_start:y_end, x_start:x_end]

        # rotate if object is page connection and dimension wide is less than height
        if object["Object"] == "page connection":
            (height, wide) = cropped_img.shape[:2]

            if height > wide:
                cropped_img = utils.rotate_image(cropped_img, 270)

        # remove circle from instrument tag
        if "instrument" in object["Object"]:
            cropped_img = utils.remove_circular_lines(cropped_img, param1=50, param2=80, minRadius=30 ,maxRadius=100, thickness=3, outside=False)

        # save a processed cropped image
        cv2.imwrite(cropped_img_name, cropped_img)

        # read text in processed cropped image
        result = reader.readtext(
            cropped_img,
            detail = 0,
            decoder="beamsearch",
            mag_ratio=3.5,
            text_threshold=0.1)

        # save read result to list
        return_list.append(result)

    return return_list


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def main(request: Request):
    # Create dummy table
    table_data = []
    count = 7;

    for idx in range(count):
        table_data.append({
            "Index": idx+1,
            "CategoryID": 0,
            "Object": "Object to be detected",
            "Score": 0.0,
            "Id": 0,
            "Text": "Object:" + str(idx),
            })
        
    # Create JSON data to return to template
    json_data = json.dumps(table_data)
    checkboxes = []
    checkboxes.append({
        "id": 0,
        "desc": "Object to be detcted",
        "count": count,
    })

    return templates.TemplateResponse(
        "main.html",
        {
            "request": request,
            "table_data": table_data,
            "json_data": json_data,
            "weight_files": WEIGHT_FILE_LIST,
            "config_files": CONFIG_FILE_LIST,
            "model_types": MODEL_TYPES,
            "input_filename": "Not run yet!",
            "category_id": checkboxes,
        }
    )


"""
    Inference the input file with selected method.
"""
@app.post("/submit")
async def inferencing_image_and_text(
        request: Request,
        file_input: UploadFile = File(...),
        selected_model: str = Form("yolov8"),
        weight_file: str = Form("yolo_weights/yolov8_640_20231022.pt"),
        config_file: str = Form("datasets/yaml/data.yaml"),
        conf_th: float = Form(0.8),
        image_size: int = Form(640),
        text_OCR: bool = Form(False),
):
    print("Input file name:", file_input.filename)
    input_filename = file_input.filename
    input_image_str = file_input.file.read()
    file_input.file.close()

    # noinspection PyTypeChecker
    input_image_array = np.frombuffer(input_image_str, np.uint8)

    # Convert input image array to CV2
    image = cv2.imdecode(input_image_array, cv2.IMREAD_COLOR)
    corrected_image = cv2.cvtColor(image.copy(), cv2.COLOR_BGR2RGB)
    # original_image = np.copy(image)

    # Create inferencing model
    print("start detecting by using", selected_model, "model with conf =", conf_th)
    print("model_path is", weight_file)

    # Set category_mapping for ONNX model, required by updated version of SAHI
    if "yolov8onnx" in selected_model:
        import onnx, ast
        m = onnx.load(weight_file)
        props = { p.key: p.value for p in m.metadata_props }
        names = ast.literal_eval(props['names'])
        category_mapping = { str(key): value for key, value in names.items() }
    else:
        category_mapping = None

    # Set up the model to be used for inferencing.
    # sahi.AutoDetectionModel
    detection_model = AutoDetectionModel.from_pretrained(
        model_type=selected_model,
        model_path=weight_file,
        config_path=config_file,
        confidence_threshold=conf_th,
        category_mapping=category_mapping,
        device="cpu",
    )

    # Calculate the overlap ratio
    overlap_ratio = 0.2 #float(32 / image_size)

    # Correct the image size
    image_size = (int(math.ceil((image_size + 1) / 32))-1) * 32
    #print(int(math.ceil((image_size + 1) / 32))-1)
    #print(int(math.ceil((300 + 1) / 32))-1)

    # Set the IoU threshold for NMS during merging
    iou_threshold = 0.1

    # Run the inferencing model
    # use verbose = 2 to see predection time
    print(f"Run the sliced prediction of {image_size}x{image_size} slices.")
    result = get_sliced_prediction(
        corrected_image,
        detection_model,
        slice_height=image_size,
        slice_width=image_size,
        overlap_height_ratio=overlap_ratio,
        overlap_width_ratio=overlap_ratio,
        verbose=2,
        postprocess_type="NMS",
        postprocess_match_metric="IOU",
        postprocess_match_threshold=iou_threshold,
    )

    # Extract the result from inferencing model
    result.export_visuals(
        export_dir="static/images/",  # save the output picture for display
        text_size=0.5,
        rect_th=2,
        hide_labels=True,
        hide_conf=True,
        file_name="prediction_visual",  # output file name
    )

    cv2.imwrite('static/images/prediction_visual.png', image)

    object_prediction_list = result.object_prediction_list

    # Crops bounding boxes over the source image and exports
    crop_object_predictions(corrected_image, object_prediction_list, "croped object detected")

    # Initialize data list and index
    table_data = []
    symbol_with_text = []
    category_ids = set()
    category_names = set()
    index = 0

    # Get the prediction list from inferenced result
    prediction_list = result.object_prediction_list

    input_filename = str(input_filename) + f": found {str(len(prediction_list))} objects."
    print("Found", len(prediction_list), "objects.")

    category_object_count = [ 0 for i in range(len(list(detection_model.category_mapping.values())))]
    #print(category_object_count)

    # Extarct bboxes from prediction result
    for prediction in prediction_list:
        bbox = prediction.bbox
        x = bbox.minx
        y = bbox.miny
        w = bbox.maxx - x
        h = bbox.maxy - y
        object_category = prediction.category.name
        object_category_id = prediction.category.id
        index += 1

        #print(object_category_id, object_category)
        category_ids.add(object_category_id)
        category_names.add(object_category)

        # save data to use in HTML canvas
        table_data.append({
            "Index": index,
            "Object": object_category,
            "CategoryID": object_category_id,
            "ObjectID": category_object_count[object_category_id] + 1,
            "Left": math.floor(x),
            "Top": math.floor(y),
            "Width": math.ceil(w),
            "Height": math.ceil(h),
            "Score": round(prediction.score.value, 3),
            "Text": f"number {str(category_object_count[object_category_id] + 1)}",
            #"Text": f"class:object: ({object_category_id}:{str(category_object_count[object_category_id])}) (No text)",
        })

        category_object_count[object_category_id] = category_object_count[object_category_id] + 1

        # Add current object to symbol with text list
        if object_category in SYMBOL_WITH_TEXT:
            symbol_with_text.append(table_data[-1])
            table_data[-1]["Text"] = table_data[-1]["Text"] + " OCR OFF"
    
    if text_OCR:
        # Extract the text from prediciton
        print("Found", len(symbol_with_text), "object to be text.")
        text_list = extract_text_from_image(image, symbol_with_text)

        if len(text_list) > 0:
            for i in range(len(text_list)):
                index = symbol_with_text[i]["Index"] - 1
                txt_to_display = symbol_with_text[i]["Text"] + ", " + " ".join(text_list[i])
                table_data[index]["Text"] = txt_to_display
                #print(txt_to_display)

    # sort table_data by 'CategoryID' then 'ObjectID'
    sorted_data = sorted(table_data, key=lambda x: (x['CategoryID'], x['ObjectID']))

    for i in range(len(sorted_data)):
        sorted_data[i]["Index"] = i + 1

    # Convert data table to JSON data
    json_data = json.dumps(sorted_data)

    # save category id and name for create checkbox table
    checkboxes = []
    category_ids_list = list(category_ids)
    category_ids_list.sort()
    category_mapping = list(detection_model.category_mapping.values())
    category_id_found = [item["CategoryID"] for item in table_data]
    #print(detection_model.category_mapping)

    for i in range(len(category_ids)):
        checkboxes.append({
            "id": category_ids_list[i],
            "desc": category_mapping[category_ids_list[i]],
            "count": category_id_found.count(category_ids_list[i]),
        })

    return templates.TemplateResponse(
        "main.html",
        {
            "request": request,
            "image1": True,
            "table_data": sorted_data,
            "json_data": json_data,
            "weight_files": WEIGHT_FILE_LIST,
            "config_files": CONFIG_FILE_LIST,
            "model_types": MODEL_TYPES,
            "input_filename": input_filename,
            "category_id": checkboxes,
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
    
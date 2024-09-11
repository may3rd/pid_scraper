# PID-Scraper

Process Piping and Instrumentation Diagram (P&amp;ID) images to extract relevant data.

# Road Map of this development

1. Identify circles on P&IDs (replaced by yolov8/coreml object detection)
2. Identify letters and any type of information on circles
    - use CRAFT-pytorch to detect the text area
    - use [EasyOCR](https://github.com/JaidedAI/EasyOCR.git)
3. For large image, using [SAHI](https://github.com/obss/sahi) to slice image.
    - autoslice and detect by create customized framework into SAHI.
4. Identify other shapes
    - train yolov8 to detect valve, instrument, equipment
5. Identify other type of information on P&IDs
6. Extract complete information
7. Create a report
8. Identify differences between P&ID versions

## Current status
- Upgrade web UI
- Customize EasyOCR or other text ocr to extract text from P&amp;ID

## TODO

- Fine tune the model for other P&amp;ID of other plants.

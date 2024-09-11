import os
import fitz  # PyMuPDF
from PIL import Image


def convert_pdf_to_png(pdf_file_path, output_folder, max_width, resolution):
    # Open the PDF document
    pdf_document = fitz.open(pdf_file_path)

    # Extract file name
    base_filename = os.path.splitext(os.path.basename(pdf_file_path))[0]

    # Convert each page to JPEG images with specific resolution
    for page_number in range(pdf_document.page_count):
        page = pdf_document[page_number]
        image = page.get_pixmap(matrix=fitz.Matrix(1, 1).prescale(resolution / 72, resolution / 72))

        # If current image width larger than max_width charge the size of converted image
        width, height = image.width, image.height

        if width > max_width:
            new_height = int(height * max_width / width)
            image = page.get_pixmap(matrix=fitz.Matrix(1, 1).prescale(resolution / 72, resolution / 72))

        # Generate image file name to save
        image_file_poth = os.path.join(output_folder, f"{base_filename}_page{page_number + 1}.png")

        # Save image
        image.save(image_file_poth)

    # Close the PDF document
    pdf_document.close()


def batch_convert_pdf_to_png(input_folder, output_folder, max_width, resolution):
    # Create output folder if not exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Searching for all PDF files in input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".pdf"):
            pdf_file_path = os.path.join(input_folder, filename)

            # Call convert function for each file
            convert_pdf_to_png(pdf_file_path, output_folder, max_width, resolution)

            # log for convert file
            print(f"Converted {filename} to PNG images.")


if __name__ == "__main__":
    input_folder = "./datasets/pdf_input"  # Provide the path to the folder containing PDFs
    output_folder = "./datasets/output"  # Provide the path to the output folder
    max_width = 4961  # Specify the maximum image width in pixels
    resolution = 300  # Specify the resolution in DPI

    batch_convert_pdf_to_png(input_folder, output_folder, max_width, resolution)

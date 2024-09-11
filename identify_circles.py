import cv2
import numpy as np
import pytesseract
import matplotlib.pyplot as plt
import imutils
import re


def circle_detection(image_path=r"./image_tests/output1.jpg", min_radius=115, max_radius=120, resize_factor=1.0,
                     show_flag=False):
    # load image
    image = cv2.imread(image_path, 1)

    # height, width, depth and ratio
    h, w, d = image.shape
    # resized_w = 1400
    # ratio = resized_w / w

    # resize image
    resized = imutils.resize(image, width=int(w / resize_factor))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    margin = int(10 / resize_factor)

    # blurr the image
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Identify circles
    all_circles = cv2.HoughCircles(
        blurred,
        method=cv2.HOUGH_GRADIENT,
        dp=0.1,
        minDist=int(100 / resize_factor),
        param1=int(20 / resize_factor),
        param2=int(10 / resize_factor),
        minRadius=int(min_radius / resize_factor),
        maxRadius=int(max_radius / resize_factor),
    )

    detected_circles = np.uint16(np.around(all_circles))
    print("It found " + str(detected_circles.shape[1]) + " circles on the pi&d")

    img_circles = resized.copy()
    image_return = resized.copy()

    for count, current_circle in enumerate(detected_circles[0]):
        # Remove detected circle from image_return
        cv2.circle(image_return, (current_circle[0], current_circle[1]), current_circle[2] + margin, (255, 255, 255), -1)

        # Annotate circle and centroid
        cv2.circle(img_circles, (current_circle[0], current_circle[1]), current_circle[2], (255, 0, 0), 2)
        cv2.circle(img_circles, (current_circle[0], current_circle[1]), 2, (255, 0, 0), -2)

        # Annotate text
        offset_txt = int(current_circle[2] * 1.2)
        cv2.putText(
            img_circles,
            "Circle " + str(count),
            (current_circle[0] - offset_txt, current_circle[1] + offset_txt),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.3,
            (255, 0, 0),
            1,
        )

    plt.imsave(fname="img_output.jpg", arr=img_circles)

    image_return = imutils.resize(image_return, width=w)
    plt.imsave(fname="image_return.jpg", arr=image_return)

    if show_flag:
        cv2.imshow("Image", img_circles)
        cv2.waitKey(0)

    return image, detected_circles


def text_in_circles_detection(image, detected_circles, resize_factor=1.0, show_flag=False):
    # Read information in every circle
    cropped_imgs = []
    cropped_imgs_txt = []
    img_circle_txt = image.copy()

    pytesseract.pytesseract.tesseract_cmd = (
        r"/Users/maetee/anaconda3/envs/pid_scraper/bin/tesseract"
    )

    circles_int = np.uint16(detected_circles[0] * resize_factor)

    # noinspection PyTypeChecker
    for circle in circles_int:
        y_offset_up = np.uint16(circle[2] * 0.75)
        y_offset_low = np.uint16(circle[2] * 0.75)
        x_offset_left = np.uint16(circle[2] * 0.75)
        x_offset_right = np.uint16(circle[2] * 0.75)
        cropped_img_lower = img_circle_txt[
                            circle[1]: circle[1] + y_offset_low,
                            circle[0] - x_offset_left: circle[0] + x_offset_right,
                            ]
        cropped_img_upper = img_circle_txt[
                            circle[1] - y_offset_up: circle[1],
                            circle[0] - x_offset_left: circle[0] + x_offset_right,
                            ]
        # cropped_img = cv2.threshold(cropped_img, 100, 255, cv2.THRESH_BINARY)
        cropped_imgs.append(np.append(cropped_img_upper, cropped_img_lower, axis=0))

        upper = pytesseract.image_to_string(
            cropped_img_upper,
            lang="eng",
            config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        )
        lower = pytesseract.image_to_string(
            cropped_img_lower,
            config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        )

        r_upper = re.compile(r"[A-Z]+")
        r_lower = re.compile(r"[A-Z0-9]+")

        upper_text = ""
        lower_text = ""

        if r_upper.match(str(upper)) is not None:
            upper_text = r_upper.match(str(upper)).group(0)

        if r_lower.match(str(lower)) is not None:
            lower_text = r_lower.match(str(lower)).group(0)

        cropped_imgs_txt.append(upper_text + "-" + lower_text)

    if show_flag:
        for idx, c_img in enumerate(cropped_imgs):
            if len(cropped_imgs_txt[idx]) > 1:
                cv2.putText(
                    c_img,
                    cropped_imgs_txt[idx],
                    (50, 75),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    1,
                )
                cv2.imshow("Image", c_img)
                cv2.waitKey(0)

    return cropped_imgs_txt


def test_string(string):
    """

    :param string:
    :return: bool:
    """

    regex = r"^([a-zA-Z]{1,4})-([0-9]{3,4}[a-zA-Z]?)$"
    if re.match(regex, string):
        return True
    else:
        return False


if __name__ == '__main__':
    img_path = r"./image_tests/output1.jpg"
    img, circles = circle_detection(img_path, 115, 120, 0.7, False)
    # noinspection PyTypeChecker
    cropped_txt = text_in_circles_detection(img, circles, 0.7, False)

    if cropped_txt is not None:
        for txt in cropped_txt:
            print(txt, test_string(txt))

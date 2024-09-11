import cv2

# Load image, grayscale, Gaussian blur, adaptive threshold
# image = cv2.imread('./image_tests/output1.jpg')
image = cv2.imread('image_return.jpg')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (9, 9), 0)
thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 30)

# Remove horizontal and vertical lines
horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 1))
no_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel)
no_vertical = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel)
no_lines = cv2.add(no_horizontal, no_vertical)

# Dilate to combine adjacent text contours
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
dilate = cv2.dilate(no_lines, kernel, iterations=4)

# Find contours, highlight text areas, and extract ROIs
cnts = cv2.findContours(dilate, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts = cnts[0] if len(cnts) == 2 else cnts[1]

ROI_number = 0
for c in cnts:
    # area = cv2.contourArea(c)
    if cv2.contourArea(c) > 15000:
        x, y, w, h = cv2.boundingRect(c)
        cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 3)

cv2.imshow('no_lines', no_lines)
cv2.imshow('dilate', dilate)
cv2.imshow('image', image)
cv2.waitKey()

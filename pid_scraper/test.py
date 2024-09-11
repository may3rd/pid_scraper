from utils import myDataset
import torch
import numpy as np
import matplotlib.pyplot as plt
import torchvision.transforms.functional as F
from torchvision.utils import draw_bounding_boxes

def xywh_to_xyxy(annotation):
    xmin = annotation['left']
    ymin = annotation['top']
    xmax = xmin + annotation['width']
    ymax = ymin + annotation['height']
    return [xmin, ymin, xmax, ymax]

my_dataset = myDataset('datasets/dataset300/dataset.yaml')

fig, axs = plt.subplots(ncols=2, squeeze=False)

for i, sample in enumerate(my_dataset): # type: ignore
    #print(i, sample['image'].shape, sample['annotations'])

    box_list = []
    label_list = []
    for annotation in sample['annotations']:
        box = xywh_to_xyxy(annotation)
        box_list.append(box)
        label_list.append(annotation['class_name'])

    box_list = torch.tensor(box_list, dtype=torch.float)

    image = sample['image']  # image is already tensor
    image = draw_bounding_boxes(image, boxes=box_list, labels=label_list, colors="red")
    image = image.detach()
    image = F.to_pil_image(image)
    axs[0, i].imshow(np.asarray(image))
    axs[0, i].set(xticklabels=[], yticklabels=[], xticks=[], yticks=[])

    if i == 1:
        break

plt.show()

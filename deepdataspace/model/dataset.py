"""
deepdataspace.model.dataset

The dataset model.
"""

import json
import logging
import time
import uuid
from typing import Dict

from deepdataspace.constants import AnnotationType
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import FileReadMode
from deepdataspace.constants import LabelType
from deepdataspace.model._base import BaseModel
from deepdataspace.model.category import Category
from deepdataspace.model.image import Image
from deepdataspace.model.image import ImageModel
from deepdataspace.model.label import Label
from deepdataspace.utils.file import create_file_url
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("io.model.dataset")


def current_ts():
    return int(time.time())


class DataSet(BaseModel):
    """
    DataSet is a collection of images.
    """

    @classmethod
    def get_collection(cls):
        return cls.db["datasets"]

    # the mandatory fields
    name: str  # the dataset name

    # the optional fields
    id: str = None  # the dataset id
    path: str = None  # the dataset directory path
    type: str = None  # the dataset type
    status: str = DatasetStatus.Waiting
    detail_status: dict = {}  # detailed status of every importer/processor
    flag_export_link: str = None  # the dataset flag export link
    object_types: list = []  # what kind of objects this dataset contains
    num_images: int = 0
    files: dict = {}  # the relevant files of this dataset
    group_id: str = None
    group_name: str = None

    _batch_queue: Dict[int, ImageModel] = {}
    _batch_size: int = 100

    @classmethod
    def create_dataset(cls,
                       name: str,
                       id_: str = None,
                       type: str = None,
                       path: str = None,
                       files: dict = None,
                       ) -> "DataSet":
        """
        Create a dataset.
        Multiple datasets can have the same name.
        If you want to create a unique dataset, please specify a unique id value.

        :param name: the dataset name. Multiple datasets can have the same name.
        :param id_: the optional dataset id. If provided, a unique dataset will be created with the id value.
        :param type: the optional dataset type, can be "tsv", "coco2017".
        :param path: the optional dataset directory path.
        :param files: the optional dataset relevant files. The key is the file info, the value is the file path.
        :return: the dataset object.
        """
        if id_:
            dataset = DataSet.find_one({"id": id_})
            if dataset is not None:
                dataset.type = type or dataset.type
                dataset.path = path or dataset.path
                dataset.files = files or dataset.files
                dataset.name = name
                dataset.save()
                return dataset
        else:
            id_ = uuid.uuid4().hex

        files = files or {}
        dataset = cls(name=name, id=id_, type=type, path=path, files=files, status=DatasetStatus.Ready)
        dataset.post_init()
        dataset.save()
        return dataset

    @classmethod
    def get_importing_dataset(cls,
                              name: str,
                              id_: str = None,
                              type: str = None,
                              path: str = None,
                              files: dict = None,
                              ) -> "DataSet":
        """
        This is the same as create_dataset.
        But if the dataset is new, it's status will be set to "waiting" instead of "ready".
        """

        if id_:
            dataset = DataSet.find_one({"id": id_})
            if dataset is not None:
                dataset.type = type or dataset.type
                dataset.path = path or dataset.path
                dataset.files = files or dataset.files
                dataset.name = name
                dataset.save()
                return dataset
        else:
            id_ = uuid.uuid4().hex

        files = files or {}
        dataset = cls(name=name, id=id_, type=type, path=path, files=files, status=DatasetStatus.Waiting)
        dataset.post_init()
        dataset.save()
        return dataset

    def add_image(self,
                  uri: str,
                  thumb_uri: str = None,
                  width: int = None,
                  height: int = None,
                  id: int = None,
                  metadata: dict = None,
                  flag: int = 0,
                  flag_ts: int = 0,
                  ) -> ImageModel:
        """
        Add an image to the dataset.
        The same image will be added to the dataset multiple times if the same uri is provided without the same image id.

        :param uri: the image uri, can be a local file path stars with "file://" or a remote url starts with "http://".
        :param thumb_uri: the image thumbnail uri, also can be a local file path or a remote url.
        :param width: the image width of full resolution.
        :param height: the image height of full resolution.
        :param id: the image id, if not provided, the image id will be the current number of images in the dataset.
        :param metadata: any information data need to be stored.
        :param flag: the image flag, 0 for not flagged, 1 for positive, 2 for negative.
        :param flag_ts: the image flag timestamp.
        :return: the image object.
        """

        full_uri = uri
        thumb_uri = full_uri if thumb_uri is None else thumb_uri
        if full_uri.startswith("file://"):
            full_uri = create_file_url(full_uri[7:], read_mode=FileReadMode.Binary)
        if thumb_uri.startswith("file://"):
            thumb_uri = create_file_url(thumb_uri[7:], read_mode=FileReadMode.Binary)

        metadata = json.dumps(metadata) if metadata else "{}"

        image = None
        Model = Image(self.id)
        if id is not None:
            image = Model.find_one({"id": id})
            if image is not None:
                user_objects = list(filter(lambda obj: obj.label_type == LabelType.User, image.objects))
                image.objects = user_objects

        if image is None:
            image_id = id or self.num_images
            image = Model(
                    id=image_id, idx=self.num_images,
                    type=self.type, dataset_id=self.id,
                    url=thumb_uri, url_full_res=full_uri,
                    width=width, height=height,
                    flag=flag, flag_ts=flag_ts,
                    metadata=metadata,
            )
        else:
            # please don't change idx in this case
            image.url = thumb_uri or image.url
            image.url_full_res = uri or image.url_full_res
            image.width = width or image.width
            image.height = height or image.height
            image.flag = flag or image.flag
            image.flag_ts = flag_ts or image.flag_ts
            image.metadata = metadata or image.metadata
        image.post_init()
        image._dataset = self  # this saves a db query

        image.save()
        self.num_images = Model.count_num({})
        self.save()

        return image

    def batch_add_image(self,
                        uri: str,
                        thumb_uri: str = None,
                        width: int = None,
                        height: int = None,
                        id_: int = None,
                        metadata: dict = None,
                        flag: int = 0,
                        flag_ts: int = 0, ) -> ImageModel:
        """
        This is the batch version of add_image, which optimizes database performance.
        But this method is not thread safe, please make sure only one thread is calling this method.
        And after the batch add is finished, please call finish_batch_add_image to save the changes to database.

        :param uri: the image uri, can be a local file path stars with "file://" or a remote url starts with "http://".
        :param thumb_uri: the image thumbnail uri, also can be a local file path or a remote url.
        :param width: the image width of full resolution.
        :param height: the image height of full resolution.
        :param id_: the image id, if not provided, the image id will be the current number of images in the dataset.
        :param metadata: any information data need to be stored.
        :param flag: the image flag, 0 for not flagged, 1 for positive, 2 for negative.
        :param flag_ts: the image flag timestamp.
        :return: the image object.
        """

        full_uri = uri
        thumb_uri = full_uri if thumb_uri is None else thumb_uri
        if full_uri.startswith("file://"):
            full_uri = create_file_url(full_uri[7:], read_mode=FileReadMode.Binary)
        if thumb_uri.startswith("file://"):
            thumb_uri = create_file_url(thumb_uri[7:], read_mode=FileReadMode.Binary)

        metadata = metadata or {}
        metadata = json.dumps(metadata)

        # if id is not set,
        # we use a negative value to indicate we are adding a new image instead of updating an existing one
        id_ = id_ if id_ is not None else -self.num_images
        idx = -1  # we decide the idx later
        Model = Image(self.id)
        image = Model(id=id_, idx=idx,
                      type=self.type, dataset_id=self.id,
                      url=thumb_uri, url_full_res=full_uri,
                      width=width, height=height,
                      flag=flag, flag_ts=flag_ts,
                      metadata=metadata, )

        self._batch_queue[id_] = image
        self.num_images += 1

        if len(self._batch_queue) >= self._batch_size:
            self._save_image_batch()
        return image

    def _save_image_batch(self):
        """
        The internal function to flush the batch queue to database.
        """

        if not self._batch_queue:
            return

        waiting_labels = dict()
        waiting_categories = dict()
        object_types = set()
        IModel = Image(self.id)
        idx = IModel.count_num({})
        for image_id, image in self._batch_queue.items():
            for obj in image.objects:
                # setup label
                label_id = waiting_labels.get(obj.label_name, None)
                if label_id is None:
                    label_id = get_str_md5(f"{self.id}_{obj.label_name}")
                    label = Label(name=obj.label_name, id=label_id, type=obj.label_type, dataset_id=self.id)
                    label.batch_save(batch_size=self._batch_size)
                    waiting_labels[obj.label_name] = label_id
                obj.label_id = label_id

                # setup category
                category_id = waiting_categories.get(obj.category_name, None)
                if category_id is None:
                    category_id = get_str_md5(f"{self.id}_{obj.category_name}")
                    category = Category(name=obj.category_name, id=category_id, dataset_id=self.id)
                    category.batch_save(batch_size=self._batch_size)
                    waiting_categories[obj.category_name] = category_id
                obj.category_id = category_id

                # setup object types
                if AnnotationType.Classification not in object_types:
                    object_types.add(AnnotationType.Classification)
                if obj.bounding_box and AnnotationType.Detection not in object_types:
                    object_types.add(AnnotationType.Detection)
                if obj.segmentation and AnnotationType.Segmentation not in object_types:
                    object_types.add(AnnotationType.Segmentation)
                if obj.alpha and AnnotationType.Matting not in object_types:
                    object_types.add(AnnotationType.Matting)
                if obj.points and AnnotationType.KeyPoints not in object_types:
                    object_types.add(AnnotationType.KeyPoints)

            # setup image
            image.idx = idx
            image.id = idx if image.id < 0 else image.id
            image.batch_save(batch_size=self._batch_size, set_on_insert={"idx": image.idx})
            idx += 1

        # finish batch saves
        IModel.finish_batch_save()
        Label.finish_batch_save()
        Category.finish_batch_save()

        # setup dataset
        self.object_types = list(sorted(list(object_types)))
        self.num_images = IModel.count_num({})
        self.save()

        self._batch_queue.clear()

    def finish_batch_add_image(self):
        """
        This method should be called after all batch_add_image calls are finished.
        This saves all images in the buffer queue to database.
        """
        self._save_image_batch()

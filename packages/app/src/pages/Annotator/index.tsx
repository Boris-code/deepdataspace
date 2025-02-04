import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import styles from './index.less';
import Edit, { EditorMode } from '@/components/Edit';
import { ImageList } from './components/ImageList';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { FormModal } from './components/FormModal';
import { DATA } from '@/services/type';
import { useLocale } from '@/locales/helper';

const Page: React.FC = () => {
  const {
    images,
    setImages,
    current,
    setCurrent,
    categories,
    setCategories,
    exportAnnotations,
  } = useModel('Annotator.model');

  const { localeText } = useLocale();
  const [openModal, setModalOpen] = useState(true);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        'The current changes will not be saved. Please export before leaving.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => {
            setModalOpen(true);
          }}
        >
          {localeText('annotator.setting')}
        </Button>
        <ImageList
          images={images}
          selected={current}
          onImageSelected={(index) => {
            setCurrent(index);
          }}
        />
      </div>
      <div className={styles.right}>
        <Edit
          isSeperate={true}
          visible={true}
          mode={EditorMode.Edit}
          categories={categories}
          setCategories={setCategories}
          list={images}
          current={current}
          actionElements={[
            <Button type="primary" key={'export'} onClick={exportAnnotations}>
              {localeText('annotator.export')}
            </Button>,
          ]}
          onAutoSave={(annos: DATA.BaseObject[]) => {
            setImages((images) => {
              images[current].objects = annos;
            });
          }}
        />
      </div>
      <div className={styles.modal}>
        <FormModal open={openModal} setOpen={setModalOpen} />
      </div>
    </div>
  );
};

export default Page;

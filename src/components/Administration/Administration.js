import React, {useState} from 'react';
import { Modal, Button, Upload, Icon, Spin } from 'antd';
import Container from 'components/Container/Container';
import FileProcessor from 'utils/fileProcessor';

const Administration = () => {
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [fileProcessingInProgress, setFileProcessingInProgress] = useState(false);

    const toggleModal = () => {
        setShowFileUploadModal(!showFileUploadModal);
    }

    const processFileList = async () => {
        setFileProcessingInProgress(true);
        await FileProcessor(fileList);
        setShowFileUploadModal(false);
        setFileProcessingInProgress(false);
        setFileList([]);
    }

    const uploadProps = {
        multiple: true,
        accept: '.json,.xml',
        fileList: fileList,
        headers: {
            authorization: 'authorization-text',
        },
        onChange: info => {
            setFileList(info.fileList);
        },
        onRemove: file => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: file => {
            return false;
        }
    };
    
    return (
        <Container>
            <h1>Administrācija</h1>
            <br/>
            <h3>Spēļu protokolu augšupielāde:</h3>
            <Button type="primary" onClick={() => toggleModal()} icon="upload">
                Augšupielādēt spēļu protokolus
            </Button>

            <Modal
                visible={showFileUploadModal}
                title="Spēļu protokolu augšupielāde"
                cancelText="Atcelt"
                okText="Veikt augšupielādi"
                okButtonProps={{icon: "upload", disabled: fileProcessingInProgress}}
                cancelButtonProps={{disabled: fileProcessingInProgress}}
                closable={!fileProcessingInProgress}
                maskClosable={!fileProcessingInProgress}
                onCancel={() => toggleModal()}
                onOk={() => processFileList()}
            >
                <Spin spinning={fileProcessingInProgress} tip="Apstrādā protokolus..." size="large">
                    <Upload {...uploadProps}>
                        <Button>
                            <Icon type="file-add"/> Pievienot failus
                        </Button>
                    </Upload>
                </Spin>
            </Modal>
        </Container>
    )
}
export default Administration;

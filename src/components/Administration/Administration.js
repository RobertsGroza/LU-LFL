import React, {useState, useEffect} from 'react';
import { Modal, Button, Upload, Icon, Spin, Table, Tag } from 'antd';
import Container from 'components/Container/Container';
import FileProcessor from 'utils/fileProcessor';
import dbClient from 'utils/dbClient';

const Administration = () => {
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [fileProcessingInProgress, setFileProcessingInProgress] = useState(false);
    const [protocolHistoryData, setProtocolHistoryData] = useState([]);
    const [protocolHistoryLoading, setProtocolHistoryLoading] = useState(false);

    useEffect(() => {
        loadProtocolHistoryData();
    }, []);

    const loadProtocolHistoryData = async () => {
        setProtocolHistoryLoading(true);
        let protocolHistoryData = await dbClient.get('/protocolHistory?_sort=id&_order=desc');
        setProtocolHistoryData(protocolHistoryData.data);
        setProtocolHistoryLoading(false);
    }

    const toggleModal = () => {
        setShowFileUploadModal(!showFileUploadModal);
    }

    const processFileList = async () => {
        setFileProcessingInProgress(true);
        await FileProcessor(fileList);
        setShowFileUploadModal(false);
        setFileProcessingInProgress(false);
        setFileList([]);

        let protocolHistoryData = await dbClient.get('/protocolHistory?_sort=id&_order=desc');
        setProtocolHistoryData(protocolHistoryData.data)
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
        
    const columns = [
        {
            title: 'Protokols',
            dataIndex: 'fileName',
            key: 'fileName',
        },
        {
            title: 'Statuss',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'success' ? 'green' : 'volcano'} key={status}>
                    {status === 'success' ? 'apstrādāts' : 'noraidīts'}
                </Tag>
            )
        },
        {
            title: 'Kļūda',
            dataIndex: 'error',
            key: 'error',
            render: error => error !== null ? error : '-'
        },
        {
            title: 'Augšupielādes laiks',
            dataIndex: 'time',
            key: 'time'
        }
    ];

    return (
        <Container>
            <h1>Administrācija</h1>
            <br/>
            <h3>Spēļu protokolu augšupielāde:</h3>
            <Button type="primary" onClick={() => toggleModal()} icon="upload">
                Augšupielādēt spēļu protokolus
            </Button>

            <h3 style={{paddingTop: '35px'}}>Protokolu audits:</h3>
            <Table
                style={{paddingTop: '5px', paddingBottom: '35px'}}
                dataSource={protocolHistoryData}
                columns={columns}
                loading={protocolHistoryLoading}
                rowKey='id'
            />

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

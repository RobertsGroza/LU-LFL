import React from 'react';
import './Container.css';
import { Row, Col } from 'antd';

const Container = ({children}) => 
    <Row style={{ padding: '0 50px' }}>
        <Col span={20} offset={2} className="container">
            {children}
        </Col>
    </Row>

export default Container;

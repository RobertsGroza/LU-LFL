import React, { useCallback, useContext } from "react";
import { withRouter, Redirect } from "react-router";
import app from "../../base";
import './Login.css';
import { AuthContext } from "Auth";
import { Form, Icon, Input, Button, notification } from 'antd';

const failedLogInNotification = () => {
  notification.error({
    message: 'Nepareizs lietotājvārds vai parole!',
    description: 'Lūdzu, mēģiniet vēlreiz!',
    duration: 3
  });
};

const successfulLogInNotification = () => {
  notification.success({
    message: 'Autorizācija veiksmīga!',
    duration: 3
  });
};

const NormalLoginForm = ({form, history}) => {
  const handleLogin = useCallback(
    event => {
      event.preventDefault();
      form.validateFields(async (err, values) => {
        if (!err) {
          try {
            await app.auth().signInWithEmailAndPassword(values.email, values.password);
            successfulLogInNotification();
            history.push("/");
          } catch (error) {
            console.error(error);
            failedLogInNotification();
          }
        }
      });
    },
    [form, history]
  );

  const { getFieldDecorator } = form;

  const { currentUser } = useContext(AuthContext);

  if (currentUser) {
    return <Redirect to="/admin" />;
  }

  return <div className="login-form">
    <h1>Ienākt</h1>

    <Form onSubmit={handleLogin}>
      <Form.Item>
        {getFieldDecorator('email', {
          rules: [{ required: true, message: 'Lūdzu ievadiet e-pastu!' }],
        })(
          <Input
            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="E-pasts"
          />,
        )}
      </Form.Item>
      <Form.Item>
        {getFieldDecorator('password', {
          rules: [{ required: true, message: 'Lūdzu ievadiet paroli!' }],
        })(
        <Input
          prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
          type="password"
          placeholder="Parole"
        />
        )}
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Ienākt
          <Icon type="login"/>
        </Button>
      </Form.Item>
    </Form>
  </div>;
}

const WrappedNormalLoginForm = Form.create({ name: 'normal_login' })(NormalLoginForm);

export default withRouter(WrappedNormalLoginForm);

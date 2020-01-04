import React, { useCallback, useContext } from "react";
import { withRouter, Redirect } from "react-router";
import app from "../../base";
import { AuthContext } from "Auth";
import { Form, Icon, Input, Button } from 'antd';

const NormalLoginForm = ({form, history}) => {
  const handleLogin = useCallback(
    async event => {
      event.preventDefault();
      let email = form.getFieldValue('username');
      let password = form.getFieldValue('password');

      try {
        await app
          .auth()
          .signInWithEmailAndPassword(email, password);
        history.push("/");
      } catch (error) {
        alert(error);
      }
    },
    [history]
  );

  const { getFieldDecorator } = form;

  const { currentUser } = useContext(AuthContext);

  if (currentUser) {
    return <Redirect to="/admin" />;
  }

  return (
    <Form onSubmit={handleLogin} className="login-form">
      <Form.Item>
        {getFieldDecorator('username', {
          rules: [{ required: true, message: 'Please input your username!' }],
        })(
          <Input
            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="E-pasts"
          />,
        )}
      </Form.Item>
      <Form.Item>
        {getFieldDecorator('password')(
        <Input
          prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
          type="password"
          placeholder="Parole"
        />
        )}
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Ielogoties
        </Button>
      </Form.Item>
    </Form>
  );
}

const WrappedNormalLoginForm = Form.create({ name: 'normal_login' })(NormalLoginForm);

export default withRouter(WrappedNormalLoginForm);
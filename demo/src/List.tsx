import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Table,
  Form,
  Typography,
  Row,
  Col,
  Space,
  Divider,
  Progress,
} from 'antd';
import { HashGenerator } from 'hash-gen/wasm';
import { fileOpen } from './filesystem';

const List = () => {
  const [progress, setProgress] = useState(0);
  const [list, setList] = useState<any[]>([]);

  const $ = useMemo(() => {
    return new HashGenerator();
  }, []);

  const onClick = async () => {
    $.initState();
    setList([]);
    setProgress(0);

    try {
      const files = await fileOpen({
        description: '해시',
        multiple: true,
      });

      const data = await $.run({
        hashType: 'SHA256',
        files,
        onNotify: (event) => {
          console.log(event);
          if (
            event.type === 'error' ||
            event.type === 'done' ||
            event.type === 'initialized'
          ) {
            return;
          }

          const files = event.payload;
          setList(files);

          if (event.type === 'status') {
            setProgress(event.state.totalProgress);
          }
        },
      });

      setList(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Form layout="vertical">
          <Form.Item label="첨부파일">
            <Row>
              <Col xs={24} sm={24} md={24} lg={24}>
                <Row gutter={16}>
                  <Col xs={24} sm={24} md={24} lg={24}>
                    <Progress percent={progress} status="active" />
                  </Col>
                  <Col xs={24} sm={24} md={24}>
                    <Space style={{ marginTop: '0.75rem', float: 'right' }}>
                      <Button
                        type="primary"
                        htmlType="button"
                        onClick={onClick}
                      >
                        파일선택
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        <Table
          title={() => <Typography.Title level={4}>해시 목록</Typography.Title>}
          columns={[
            {
              title: '번호',
              align: 'center',
              render: (_, __, index) => {
                return index + 1;
              },
            },
            {
              title: '파일명',
              dataIndex: 'file',
              render: (file: File) => {
                return file.name;
              },
            },
            {
              title: '해시',
              align: 'center',
              dataIndex: 'hash',
            },
            {
              title: '상태',
              align: 'center',
              dataIndex: 'progress',
              render: (value: number) => {
                return (
                  <Progress type="circle" percent={value} status="active" />
                );
              },
            },
          ]}
          scroll={{ x: 'max-content' }}
          dataSource={list}
          rowKey="index"
        />
      </Card>
    </Space>
  );
};

export default List;

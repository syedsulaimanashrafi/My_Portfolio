import request from 'supertest';
import { app } from '@app';
import { initializeTestDataSource, closeTestDataSource } from '@test/setup/test-datasource';
import { NetworkRepository } from '@repositories/NetworkRepository';
import { GatewayRepository } from '@repositories/GatewayRepository';

jest.mock('@middlewares/authMiddleware', () => ({
  authenticateUser: () => (_req: any, _res: any, next: any) => next(),
}));

describe('SensorController (integration)', () => {
  let server: any;
  const prefix = '/api/v1';
  const networkId = 'NET1';
  const gatewayMac = 'GW1';
  const sensorMac = 'S1';

  beforeAll(async () => {
    await initializeTestDataSource();
    server = app.listen();
    await new NetworkRepository().createNetwork(networkId, 'Net One', 'desc', []);
    await new GatewayRepository().createGateway(networkId, { macAddress: gatewayMac, name: 'G1', description: '...' });
  });

  afterAll(async () => {
    await closeTestDataSource();
    server.close();
  });

  it('should create a sensor [POST /networks/:nid/gateways/:gid/sensors]', async () => {
    const payload = {
      macAddress: sensorMac,
      name: 'Sensor One',
      description: 'desc',
      variable: 'temperature',
      unit: '°C'
    };

    const res = await request(server)
      .post(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ macAddress: sensorMac, name: 'Sensor One' });
  });

  it('should list sensors [GET /networks/:nid/gateways/:gid/sensors]', async () => {
    const res = await request(server)
      .get(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s: any) => s.macAddress === sensorMac)).toBe(true);
  });

  it('should retrieve a sensor [GET /networks/:nid/gateways/:gid/sensors/:sid]', async () => {
    const res = await request(server)
      .get(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors/${sensorMac}`);

    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(sensorMac);
  });

  it('should update a sensor [PUT /networks/:nid/gateways/:gid/sensors/:sid]', async () => {
    const res = await request(server)
      .put(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .send({
        macAddress: sensorMac,  // Required by controller
        name: 'Sensor X'
      });

    expect(res.status).toBe(204); // ← Corrected expectation
  });

  it('should delete a sensor [DELETE /networks/:nid/gateways/:gid/sensors/:sid]', async () => {
    await request(server)
      .delete(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .expect(204);

    await request(server)
      .get(`${prefix}/networks/${networkId}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .expect(404);
  });
});

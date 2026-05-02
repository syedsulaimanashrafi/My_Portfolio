import * as networkController from "@controllers/networkController";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";

jest.mock("@repositories/NetworkRepository");

describe("NetworkController integration", () => {
  it("getNetwork: mapperService integration", async () => {
    const fakeNetworkDAO: NetworkDAO = {
      code: "NET_TEST",
      name: "Test Network",
      description: "This is a test network",
      gateways: []
    };

    const expectedDTO = {
      code: fakeNetworkDAO.code,
      name: fakeNetworkDAO.name,
      description: fakeNetworkDAO.description,
      gateways: fakeNetworkDAO.gateways
    };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
    }));

    const result = await networkController.getNetwork("NET_TEST");

    expect(result).toEqual(expectedDTO);
  });


  it("getAllNetworks: mapperService integration", async () => {
    const fakeNetworks: NetworkDAO[] = [
      {
        code: "NET1",
        name: "Network One",
        description: "Description One",
        gateways: []
      },
      {
        code: "NET2",
        name: "Network Two",
        description: "Description Two",
        gateways: []
      }
    ];

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue(fakeNetworks)
    }));

    const result = await networkController.getAllNetworks();

    expect(result).toEqual(fakeNetworks);
  });

  it("createNetwork: calls repository with correct data", async () => {
    const newNetwork = {
      code: "NEW_CODE",
      name: "New Network",
      description: "New description",
      gateways: []
    };

    const mockCreate = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: mockCreate
    }));

    await networkController.createNetwork(newNetwork);

    expect(mockCreate).toHaveBeenCalledWith(
      newNetwork.code,
      newNetwork.name,
      newNetwork.description,
      newNetwork.gateways
    );
  });

  it("updateNetwork: calls repository with correct data", async () => {
    const updatedNetwork = {
      code: "UPD_CODE",
      name: "Updated Network",
      description: "Updated description",
      gateways: []
    };

    const mockUpdate = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: mockUpdate
    }));

    await networkController.updateNetwork("UPD_CODE", updatedNetwork);

    expect(mockUpdate).toHaveBeenCalledWith("UPD_CODE", updatedNetwork);
      
  });

  it("deleteNetwork: calls repository with correct code", async () => {
    const mockDelete = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: mockDelete
    }));

    await networkController.deleteNetwork("DEL_CODE");

    expect(mockDelete).toHaveBeenCalledWith("DEL_CODE");
  });
});